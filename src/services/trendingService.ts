import storage from "node-persist";

export const getUserState = async (userId: number): Promise<any> => {
  const userState = await storage.getItem(`user_${userId}`);
  if (!userState) {
    const bid_userState = {
      network: "sol",
      sol: {
        network: "sol",
        address: "0",
        amount: 0,
        usdAmount: 0,
        withdrawAmount: 0,
        lastInvestTime: 0,
        lastInvestAmount: 0,
      },
      ton: {
        network: "ton",
        address: "0",
        amount: 0,
        usdAmount: 0,
        withdrawAmount: 0,
        lastInvestTime: 0,
        lastInvestAmount: 0,
      },
      tonUsdt: {
        network: "tonUsdt",
        address: "0",
        amount: 0,
        usdAmount: 0,
        withdrawAmount: 0,
        lastInvestTime: 0,
        lastInvestAmount: 0,
      },
    };
    await saveUserState(userId, bid_userState);
    return bid_userState;
  }
  return userState;
};

export const saveUserState = async (userId: number, userData: any) => {
  await storage.setItem(`user_${userId}`, userData);
};
