import TelegramBot from "node-telegram-bot-api";
import storage from "node-persist";

storage.init();

import { getUserState } from "../services/trendingService";

export const startCommand =
  (bot: TelegramBot) => async (msg: TelegramBot.Message) => {
    console.log("start command");
    const chatId = msg.chat.id;
    const userId = msg.from?.username;
    try {
      const userState = await getUserState(chatId);
      const txt =
        `Hello welcome <code>${userId}</code> to Tarx Pools\n\n` +
        `Percentage based Trading and crypto arbitrage bot\n\n` +
        `<i>Sail in with us through the sea of opportunities</i>`;

      await bot.sendMessage(chatId, txt, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Group Chat", url: "https://t.me/+4BF4PVkZ4RczMjU1" }],
          ],
        },
        parse_mode: "HTML",
      });

      const menu_txt = "🔝 Main Menu";
      const inlineButtons = [
        [
          { text: "Dashboard", callback_data: "dashboard" },
          { text: "Deposit", callback_data: "deposit" },
          { text: "Withdraw", callback_data: "withdraw" },
        ],
        [
          { text: "ALPHA POOL", callback_data: "alpha_pool" },
          { text: "Transaction", callback_data: "transaction" },
        ],
        [{ text: "Reach out to us", callback_data: "reach_out" }],
      ];

      await bot.sendMessage(chatId, menu_txt, {
        reply_markup: {
          keyboard: inlineButtons,
        },
      });
    } catch (error) {
      bot.sendMessage(chatId, `Error: ${(error as Error).message}`);
    }
  };

export const dashboardCommand =
  (bot: TelegramBot) => async (msg: TelegramBot.Message) => {
    console.log("dashboard command function called");
    const userId = msg.from?.username;
    const chatId = msg.chat.id;
    const userData = await getUserState(chatId);
    const network = userData.network;
    const txt =
      `Nice to see you again <code>${userId}</code> 🔥\n\n` +
      `Your Balance = ${userData[network].usdAmount}$\n\n` +
      `Your Referral link = https://t.me/Tctradeandarbitragebot?start=00002955456\n\n` +
      `Your user code : 00002955456\n\n` +
      `Next Accruals = 30.01.2025 12:00pm UTC\n\n` +
      `Your first to third level referral\n\n` +
      `lvl 1 : 0\n` +
      `lvl 2 : 0\n` +
      `lvl3 : 0\n\n` +
      `Thank you for sailing with us through this sea of opportunities! \n` +
      `Empty stomachs and empty pockets can't stop us from being who we want to be` +
      `Only empty hearts and empty heads can.`;

    bot.sendMessage(chatId, txt, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "READ ABOUT US",
              url: "https://telegra.ph/TAR-GLOBAL-10-31",
            },
          ],
        ],
      },
      parse_mode: "HTML",
    });
  };

export const depositCommand =
  (bot: TelegramBot) => async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userData = await getUserState(chatId as number);
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
  };

export const reachOutCommand =
  (bot: TelegramBot) => async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;

    const txt = `<b>JOIN OUR CHANNEL</b>
    
    And join our Strategies Group
    Trades taken and prooofs of profits are shared there`;

    const inline_keyboard = [
      [{ text: "CHANNEL", url: "https://t.me/+7amwA0kPljY4Zjl1" }],
      [{ text: "GROUP", url: "https://t.me/+4BF4PVkZ4RczMjU1" }],
      [{ text: "Strategies", url: "https://t.me/+0nsorBvUEsBjYTQ1" }],
    ];

    await bot.sendMessage(chatId, txt, {
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
      parse_mode: "HTML",
    });
  };

export const transactionCommand =
  (bot: TelegramBot) => async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const txt = `Send Transaction hash of the confirmed transaction Or send a screenshot that confirms the transactions

Note ⚠️ the screenshot must show date and time and the receiver address /account`;
    bot.sendMessage(chatId, txt);
  };

export const referralCommand =
  (bot: TelegramBot) => async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.username;

    const txt = `Hello how is it going 🫡 ${userId}🔥

**We have prepared a whooping 6 levels referral system for you

Yes you heard me right 6!!**
﻿
Your Referral Link : https://t.me/Tctradeandarbitragebot?start=00002955456

The levels are

Level 1 : 5%
Level 2 : 3%
Level 3 : 2%
Level 4 : 1%
Level 5 : 0.5%
Level 6 : 0.25%

Your Referrals

Level 1 = 0
Level 2 = 0
Level 3 = 0
Level 4 = 0
Level 5 = 0
Level 6 = 0

Our reason for upgrading this is to motivate you, we're creating an ecosystem so this is our reward to you :)`;
    bot.sendMessage(chatId, txt);
  };
