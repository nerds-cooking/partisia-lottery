import { LotteryStatusD } from '@/lib/LotteryApiGenerated';

export const getStatusColor = (status: LotteryStatusD) => {
  switch (status) {
    case LotteryStatusD.Open:
      return 'bg-green-500';
    case LotteryStatusD.Closed:
      return 'bg-yellow-500';
    case LotteryStatusD.Complete:
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

export const getStatusText = (status: LotteryStatusD) => {
  switch (status) {
    case LotteryStatusD.Open:
      return 'Active';
    case LotteryStatusD.Closed:
      return 'Drawing in Progress';
    case LotteryStatusD.Complete:
      return 'Completed';
    default:
      return 'Unknown';
  }
};
