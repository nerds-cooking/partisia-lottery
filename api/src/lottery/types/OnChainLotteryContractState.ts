import { LotteryStatusD } from 'src/utils/LotteryApiGenerated';

export interface OnChainLotteryContractState {
  userAccounts: { address: string; rawId: string }[];
  lotteries: {
    lotteryId: string;
    creator: string;
    status: LotteryStatusD;
    deadline: string;
    entryCost: string;
    prizePool: string;
    winner: string | null;
  }[];
  lotteryAccounts: {
    lotteryId: string;
    rawId: string;
  }[];
}
