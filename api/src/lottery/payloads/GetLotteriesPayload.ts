import { LotteryStatusD } from 'src/utils/LotteryApiGenerated';

export interface GetLotteriesPayload {
  page: number;
  limit: number;
  status: LotteryStatusD;
}
