import TelegramBot from "node-telegram-bot-api";
import {
  dashboardCommand,
  depositCommand,
  reachOutCommand,
  referralCommand,
  startCommand,
  transactionCommand,
} from "./controllers/botController";
import dotenv from "dotenv";
import { getUserState, saveUserState } from "./services/trendingService";
import {
  depositSOLCheck,
  depositTonCheck,
  getSolUsdPrice,
  getTonUsdPrice,
} from "./utils/depositFunction";
import cron from "node-cron";
import storage from "node-persist";
import {
  transferSolFunction,
  transferTonFunction,
} from "./utils/transferFunction";

dotenv.config();

const token = process.env.TELEGRAM_TOKEN as string;
const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands([{ command: "/start", description: "Start the bot" }]);

const investCalcFunction = async () => {
  try {
    console.log("investCalcFunction called at", new Date().toUTCString());
    const keys = await storage.keys();
    const userDatas = await Promise.all(
      keys.map(async (key) => {
        const userData = await storage.getItem(key);
        return { key, ...userData };
      })
    );
    console.log("userDatas:", userDatas);

    const updatedUserDatas = userDatas.map(({ key, ...userData }) => {
      const { sol, ton, tonUsdt } = userData;
      const solWithdrawAmount = getSolWithdrawAmount(sol.usdAmount);
      const tonWithdrawAmount = getTonWithdrawAmount(ton.usdAmount);
      const tonUsdtWithdrawAmount = getTonUsdtWithdrawAmount(tonUsdt.usdAmount);

      return {
        key,
        ...userData,
        sol: { ...sol, withdrawAmount: solWithdrawAmount },
        ton: { ...ton, withdrawAmount: tonWithdrawAmount },
        tonUsdt: { ...tonUsdt, withdrawAmount: tonUsdtWithdrawAmount },
      };
    });

    await Promise.all(
      updatedUserDatas.map(async ({ key, ...userData }) => {
        await storage.setItem(key, userData);
      })
    );

    console.log("User Datas updated and saved.");
  } catch (error) {
    console.error("Error in investCalcFunction:", error);
  }
};

const getSolWithdrawAmount = (usdAmount: number) => {
  return usdAmount >= 5000 ? usdAmount * 0.03 : usdAmount * 0.02;
};

const getTonWithdrawAmount = (usdAmount: number) => {
  return usdAmount >= 5000 ? usdAmount * 0.03 : usdAmount * 0.02;
};

const getTonUsdtWithdrawAmount = (usdAmount: number) => {
  return usdAmount >= 5000 ? usdAmount * 0.03 : usdAmount * 0.02;
};

cron.schedule("0 6 * * *", () => {
  investCalcFunction();
});

// Command Handlers
bot.onText(/\/start/, async (msg) => {
  await startCommand(bot)(msg);
});

bot.onText(/Dashboard/, async (msg) => {
  await dashboardCommand(bot)(msg);
});

bot.onText(/Deposit/, async (msg) => {
  await depositCommand(bot)(msg);
});

bot.onText(/Reach out to us/, async (msg) => {
  await reachOutCommand(bot)(msg);
});

bot.onText(/Transaction/, async (msg) => {
  await transactionCommand(bot)(msg);
});

bot.onText(/Referrals/, async (msg) => {
  await referralCommand(bot)(msg);
});

bot.onText(/Withdraw/, async (msg) => {
  const chatId = msg.chat.id;
  const userData = await getUserState(chatId as number);
  const network = userData.network;
  if (network === "sol") {
    const solPrice = await getSolUsdPrice();
    const solAmount = userData[network].withdrawAmount / solPrice;
    const fixedSolAmount = Number(solAmount).toFixed(5);

    let txt =
      `Your current network is ${network}.\n` +
      `You will get ${fixedSolAmount} sol\n`;

    bot.sendMessage(chatId as number, txt, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Ok", callback_data: "withdraw_ok" },
            { text: "Cancel", callback_data: "cancel" },
          ],
        ],
      },
      parse_mode: "HTML",
    });
  }
  if (network === "ton") {
    const tonPrice = await getTonUsdPrice();
    const tonAmount = userData[network].withdrawAmount / tonPrice;
    const fixedTonAmount = Number(tonAmount).toFixed(5);

    let txt =
      `Your current network is ${network}.\n` +
      `You will get ${fixedTonAmount} TON\n`;

    bot.sendMessage(chatId as number, txt, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Ok", callback_data: "withdraw_ok" },
            { text: "Cancel", callback_data: "cancel" },
          ],
        ],
      },
      parse_mode: "HTML",
    });
  }
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  const msgId = callbackQuery.message?.message_id;

  const data = callbackQuery.data;
  const userData = await getUserState(chatId as number);
  if (data === "deposit") {
    const network = userData.network;
    const network_amount = userData[network];
    let txt =
      `Your current network is <b>${network}</b>\n` +
      `Your current investor amount is ${network_amount.amount}.\n`;

    if (network === "sol")
      txt += `Destination Address: <code>${process.env.SOL_ADMIN_WALLET}</code>\n`;
    if (network === "ton" || network === "tonUsdt")
      txt += `Destination Address: <code>${process.env.TON_ADMIN_WALLET}</code>\n`;

    bot.sendMessage(chatId as number, txt, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Ok", callback_data: "deposit_ok" },
            { text: "Cancel", callback_data: "cancel" },
          ],
        ],
      },
      parse_mode: "HTML",
    });
  }
  if (data === "deposit_ok") {
    if (userData.network === "sol") {
      bot
        .sendMessage(
          chatId as number,
          `How much do you want to deposit in USD?`,
          {
            reply_markup: { force_reply: true },
          }
        )
        .then((msg) => {
          bot.onReplyToMessage(
            chatId as number,
            msg.message_id,
            async (msg) => {
              const usdAmount = msg.text;
              const solPrice = await getSolUsdPrice();
              const solAmount = Number(usdAmount) / solPrice;
              const fixedSolAmount = Number(solAmount).toFixed(3);
              console.log("solAmount:", solAmount);
              bot
                .sendMessage(
                  chatId as number,
                  `You should deposit <code>${fixedSolAmount}</code> sol. Reply with the transaction hash in 5 min. (Please send only transaction hash. If not, your deposit balance will be lost)`,
                  {
                    reply_markup: { force_reply: true },
                    parse_mode: "HTML",
                  }
                )
                .then((msg) => {
                  bot.onReplyToMessage(
                    chatId as number,
                    msg.message_id,
                    async (msg) => {
                      console.log("msg:", msg.text);
                      const currentUnixTimestamp = Math.floor(
                        Date.now() / 1000
                      );
                      console.log("utcTime:", currentUnixTimestamp);
                      const response = await depositSOLCheck(
                        process.env.SOL_ADMIN_WALLET as string,
                        msg.text as string
                      );
                      if (
                        response.success === true &&
                        currentUnixTimestamp - response.blockTimeStamp <=
                          6000 &&
                        response.amount === Number(fixedSolAmount)
                      ) {
                        userData.sol.amount += response.amount;
                        userData.sol.lastInvestAmount = response.amount;
                        userData.sol.lastInvestTime = response.blockTimeStamp;
                        userData.sol.usdAmount += Number(usdAmount);
                        userData.sol.address = response.address;
                        await saveUserState(chatId as number, userData);
                        bot.sendMessage(
                          chatId as number,
                          `Your total Invest Amount is ${userData.sol.amount} sol`
                        );
                      } else {
                        bot.sendMessage(
                          chatId as number,
                          "Invalid Transaction Hash."
                        );
                      }
                      console.log("response:", response);
                    }
                  );
                });
            }
          );
        });
    }
    if (userData.network === "ton") {
      bot
        .sendMessage(
          chatId as number,
          `How much do you want ton to deposit in USD?`,
          {
            reply_markup: { force_reply: true },
          }
        )
        .then((msg) => {
          bot.onReplyToMessage(
            chatId as number,
            msg.message_id,
            async (msg) => {
              const usdAmount = msg.text;
              const tonPrice = await getTonUsdPrice();
              const tonAmount = Number(usdAmount) / tonPrice;
              const fixedTonAmount = Number(tonAmount).toFixed(3);
              console.log("solAmount:", tonAmount);
              bot
                .sendMessage(
                  chatId as number,
                  `You should deposit <code>${fixedTonAmount}</code> TON. Reply with the transaction hash in 5 min. (Please send only transaction hash. If not, your deposit balance will be lost)`,
                  {
                    reply_markup: { force_reply: true },
                    parse_mode: "HTML",
                  }
                )
                .then((msg) => {
                  bot.onReplyToMessage(
                    chatId as number,
                    msg.message_id,
                    async (msg) => {
                      console.log("msg:", msg.text);
                      const currentUnixTimestamp = Math.floor(
                        Date.now() / 1000
                      );
                      console.log("utcTime:", currentUnixTimestamp);
                      const response = await depositTonCheck(
                        process.env.TON_ADMIN_WALLET as string,
                        msg.text as string
                      );
                      if (
                        response.success === true &&
                        currentUnixTimestamp - response.blockTimeStamp <=
                          6000 &&
                        response.amount === Number(fixedTonAmount)
                      ) {
                        userData.ton.amount += response.amount;
                        userData.ton.lastInvestAmount = response.amount;
                        userData.ton.lastInvestTime = response.blockTimeStamp;
                        userData.ton.usdAmount += Number(usdAmount);
                        userData.ton.address = response.address;
                        await saveUserState(chatId as number, userData);
                        bot.sendMessage(
                          chatId as number,
                          `Your total Invest Amount is ${userData.ton.amount} ton`
                        );
                      } else {
                        bot.sendMessage(
                          chatId as number,
                          "Invalid Transaction Hash."
                        );
                      }
                      console.log("response:", response);
                    }
                  );
                });
            }
          );
        });
    }
    if (userData.network === "tonUsdt") {
      bot
        .sendMessage(
          chatId as number,
          `How much do you want ton to deposit in USD?`,
          {
            reply_markup: { force_reply: true },
          }
        )
        .then((msg) => {
          bot.onReplyToMessage(
            chatId as number,
            msg.message_id,
            async (msg) => {
              const usdAmount = msg.text;
              bot
                .sendMessage(
                  chatId as number,
                  `You should deposit <code>${usdAmount}</code> TON. Reply with the transaction hash in 5 min. (Please send only transaction hash. If not, your deposit balance will be lost)`,
                  {
                    reply_markup: { force_reply: true },
                    parse_mode: "HTML",
                  }
                )
                .then((msg) => {
                  bot.onReplyToMessage(
                    chatId as number,
                    msg.message_id,
                    async (msg) => {
                      console.log("msg:", msg.text);
                      const currentUnixTimestamp = Math.floor(
                        Date.now() / 1000
                      );
                      console.log("utcTime:", currentUnixTimestamp);
                      const response = await depositTonCheck(
                        process.env.TON_ADMIN_WALLET as string,
                        msg.text as string
                      );
                      if (
                        response.success === true &&
                        currentUnixTimestamp - response.blockTimeStamp <=
                          6000 &&
                        response.amount === Number(usdAmount)
                      ) {
                        userData.ton.amount += response.amount;
                        userData.ton.lastInvestAmount = response.amount;
                        userData.ton.lastInvestTime = response.blockTimeStamp;
                        userData.ton.usdAmount += Number(usdAmount);
                        userData.ton.address = response.address;
                        await saveUserState(chatId as number, userData);
                        bot.sendMessage(
                          chatId as number,
                          `Your total Invest Amount is ${userData.ton.amount} ton`
                        );
                      } else {
                        bot.sendMessage(
                          chatId as number,
                          "Invalid Transaction Hash."
                        );
                      }
                      console.log("response:", response);
                    }
                  );
                });
            }
          );
        });
    }
  }
  if (data === "withdraw") {
    const network = userData.network;
    if (network === "sol") {
      const solPrice = await getSolUsdPrice();
      const solAmount = userData[network].withdrawAmount / solPrice;
      const fixedSolAmount = Number(solAmount).toFixed(5);

      let txt =
        `Your current network is ${network}.\n` +
        `You will get ${fixedSolAmount} sol\n`;

      bot.sendMessage(chatId as number, txt, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Ok", callback_data: "withdraw_ok" },
              { text: "Cancel", callback_data: "cancel" },
            ],
          ],
        },
        parse_mode: "HTML",
      });
    }
    if (network === "ton") {
      const tonPrice = await getTonUsdPrice();
      const tonAmount = userData[network].withdrawAmount / tonPrice;
      const fixedTonAmount = Number(tonAmount).toFixed(5);

      let txt =
        `Your current network is ${network}.\n` +
        `You will get ${fixedTonAmount} TON\n`;

      bot.sendMessage(chatId as number, txt, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Ok", callback_data: "withdraw_ok" },
              { text: "Cancel", callback_data: "cancel" },
            ],
          ],
        },
        parse_mode: "HTML",
      });
    }
  }
  if (data === "setting") {
    const txt = `In setting panel, you can choose the network. Your current network is ${userData.network}`;
    bot.sendMessage(chatId as number, txt, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "SOL", callback_data: "network_sol" }],
          [
            { text: "TON", callback_data: "network_ton" },
            { text: "TON-USDT", callback_data: "network_tonUsdt" },
          ],
        ],
      },
      parse_mode: "HTML",
    });
  }
  if (data === "network_sol") {
    userData.network = "sol";
    await saveUserState(chatId as number, userData);
    await startCommand(bot)(callbackQuery.message as TelegramBot.Message);
  }
  if (data === "network_ton") {
    userData.network = "ton";
    await saveUserState(chatId as number, userData);
    await startCommand(bot)(callbackQuery.message as TelegramBot.Message);
  }
  if (data === "network_tonUsdt") {
    userData.network = "tonUsdt";
    await saveUserState(chatId as number, userData);
    await startCommand(bot)(callbackQuery.message as TelegramBot.Message);
  }
  if (data === "cancel") {
    bot.deleteMessage(chatId as number, msgId as number);
  }
  if (data === "withdraw_ok") {
    if (userData.network === "sol") {
      const signature = await transferSolFunction(
        userData.sol.address,
        userData.sol.withdrawAmount
      );
      const sig_text = `Transaction confirmed, Transaction ID:\n <a href="https://solscan.io/tx/${signature}">${signature}</a>`;
      bot.sendMessage(chatId as number, sig_text, {
        parse_mode: "HTML",
      });
    }

    if (userData.network === "ton") {
      const signature = await transferTonFunction(
        userData.ton.address,
        userData.ton.withdrawAmount
      );
      const sig_text = `Transaction confirmed, Transaction ID:\n <a href="https://solscan.io/tx/${signature}">${signature}</a>`;
      bot.sendMessage(chatId as number, sig_text, {
        parse_mode: "HTML",
      });
    }
  }
});
