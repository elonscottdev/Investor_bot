import axios from "axios";
import base64 from "base64-js";
import { Address } from "@ton/core";

interface depositCheckType {
  success: boolean;
  address: string;
  amount: number;
  blockTimeStamp: any;
}

export const depositSOLCheck = async (
  destinationAddress: string,
  transactionHash: string
): Promise<depositCheckType> => {
  const requestOptions = {
    method: "get",
    url: "https://pro-api.solscan.io/v2.0/transaction/detail",
    params: { tx: transactionHash },
    headers: {
      token: process.env.SOL_API_KEY,
    },
  };

  try {
    const response = await axios.request(requestOptions);

    if (response.data.success === true) {
      const transaction_destination_address =
        response.data.data.sol_bal_change[1].address;
      if (destinationAddress === transaction_destination_address) {
        const date = new Date(response.data.data.block_time * 1000);
        const unixTimestamp = Math.floor(date.getTime() / 1000);
        return {
          success: true,
          address: response.data.data.sol_bal_change[0].address,
          amount:
            response.data.data.sol_bal_change[1].change_amount / 1000000000,
          blockTimeStamp: unixTimestamp,
        };
      } else
        return { success: false, address: "0", amount: 0, blockTimeStamp: 0 };
    } else
      return { success: false, address: "0", amount: 0, blockTimeStamp: 0 };
  } catch (err) {
    console.error(err);
    return { success: false, address: "0", amount: 0, blockTimeStamp: 0 };
  }
};

export const depositTonCheck = async (
  destinationAddress: string,
  transactionHash: string
): Promise<depositCheckType> => {
  const requestOptions = {
    method: "get",
    url: "https://toncenter.com/api/v3/transactions",
    params: { hash: transactionHash },
  };

  try {
    const response = await axios.request(requestOptions);

    const data = response.data.transactions[0];
    console.log("response:", response.data.transactions[0]);
    const date = new Date(response.data.transactions[0].now * 1000);
    const unixTimestamp = Math.floor(date.getTime() / 1000);
    const amount = response.data.transactions[0].out_msgs[0].value / 1000000000;

    const address = Address.parse(data.out_msgs[0].source);

    const desAddress = Address.parse(data.out_msgs[0].destination);
    console.log("desAddress:", address.toString({ bounceable: false }));
    if (destinationAddress === desAddress.toString({ bounceable: false })) {
      console.log("target is correct");
      return {
        success: true,
        address: address.toString({ bounceable: false }),
        amount: amount,
        blockTimeStamp: unixTimestamp,
      };
    } else {
      return { success: false, address: "0", amount: 0, blockTimeStamp: 0 };
    }
  } catch (err) {
    console.error(err);
    return { success: false, address: "0", amount: 0, blockTimeStamp: 0 };
  }
};

export const getSolUsdPrice = async () => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const solUsdPrice = response.data.solana.usd;
    return solUsdPrice;
  } catch (error) {
    console.error("Error fetching SOL/USD price:", error);
    return 1;
  }
};

export const getTonUsdPrice = async () => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "the-open-network",
          vs_currencies: "usd",
        },
      }
    );

    const tonPrice = response.data["the-open-network"].usd;
    console.log(`Current TON price: $${tonPrice}`);
    return tonPrice;
  } catch (error) {
    console.error("Error fetching TON price:", error);
    throw error;
  }
};
