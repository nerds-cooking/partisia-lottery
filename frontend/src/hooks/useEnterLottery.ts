import axiosInstance from '@/lib/axios';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useEnterLottery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enterLottery = useCallback(
    async ({
      lotteryId,
      entryTxn,
      entryCost,
      entryCount
    }: {
      lotteryId: string;
      entryTxn: string;
      entryCost: string;
      entryCount: string;
    }) => {
      try {
        setLoading(true);
        setError(null);
        const resp = await axiosInstance.post(
          `/api/lottery/${lotteryId}/enter`,
          {
            entryTxn,
            entryCost,
            entryCount
          }
        );
        if (resp.status !== 201) {
          throw new Error('Failed to add entry to database');
        }
      } catch (err: unknown) {
        toast.error('Failed to add entry to database');
        setError((err as Error)?.message || 'Failed to add entry to database');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    enterLottery
  };
}
