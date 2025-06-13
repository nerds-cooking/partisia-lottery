import { LotteryStatusD } from '@/lib/LotteryApiGenerated';

export interface Lottery {
  createdAt: string;
  updatedAt: string;
  _id: string;
  lotteryId: string;
  name: string;
  description: string;
  status: LotteryStatusD;
  deadline: string;
  entryCost: string;
  prizePool: string;
  creationTxn: string;
}
