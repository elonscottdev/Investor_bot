import {
  Connection,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import base58 from "bs58";
import { getSolUsdPrice } from "./depositFunction";

import { TonClient, WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

export const transferSolFunction = async (
  toAddress: string,
  amount: number
) => {
  console.log("params:", toAddress, amount);
  const solPrice = await getSolUsdPrice();
  const solAmount = amount / solPrice;
  const fixedSolAmount = Number(solAmount).toFixed(5);

  const connection = new Connection(
    process.env.SOL_RPC_URL as string,
    "confirmed"
  );

  const keyPair = Keypair.fromSecretKey(
    base58.decode(process.env.SOL_ADMIN_WALLET_PRIVATE_KEY as string)
  );
  const transferTransaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(process.env.SOL_ADMIN_WALLET as string),
      toPubkey: new PublicKey(toAddress),
      lamports: Number(fixedSolAmount) * LAMPORTS_PER_SOL,
    })
  );

  const signature = await sendAndConfirmTransaction(
    connection,
    transferTransaction,
    [keyPair]
  );
  return signature;
};

export const transferTonFunction = async (
  toAddress: string,
  amount: number
) => {
  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: process.env.TON_API_KEY,
  });

  let mnemonics = process.env.TON_ADMIN_WALLET_PRIVATE_KEY as any;
  console.log("mnemonics:", mnemonics);
  mnemonics = mnemonics.split("");
  let keyPair = await mnemonicToPrivateKey(mnemonics);

  let workchain = 0;
  let wallet = WalletContractV5R1.create({
    workchain,
    publicKey: keyPair.publicKey,
  });
  let contract = client.open(wallet);

  let balance: bigint = await contract.getBalance();
  console.log("balance:", balance);
  // Create a transfer
  //   let seqno: number = await contract.getSeqno();
  //   console.log("seqno:", seqno);
  //   await contract.sendTransfer({
  //     seqno,
  //     secretKey: keyPair.secretKey,
  //     messages: [
  //       internal({
  //         value: String(amount),
  //         to: toAddress,
  //         body: "Example transfer body",
  //       }),
  //     ],
  //   });
};
