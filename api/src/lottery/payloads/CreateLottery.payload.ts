export interface CreateLotteryPayload {
  lotteryId: string;
  name: string;
  description: string;
  prizePool: string;
  entryCost: string;
  deadline: Date;
  creationTxn: string;
}
