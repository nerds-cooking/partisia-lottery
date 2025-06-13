import axiosInstance from '@/lib/axios';
import { useAuth } from '../auth/useAuth';

export interface CreateLotteryPayload {
  lotteryId: string;
  name: string;
  description: string;
  prizePool: string;
  entryCost: string;
  deadline: Date;
  creationTxn: string;
}

export function useLotteryCreation() {
  const { user } = useAuth();

  const createNewLottery = async (lotteryData: CreateLotteryPayload) => {
    if (!user) throw new Error('User not authenticated');

    const resp = await axiosInstance.post('/api/lottery', lotteryData);

    if (resp.status !== 201) {
      throw new Error('Failed to create lottery');
    }

    return resp.data;
  };

  return {
    createNewLottery
  };
}
