import axiosInstance from '@/lib/axios';
import { Lottery } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useLottery(lotteryId: string) {
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | void>(void 0);

  const getLottery = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await axiosInstance.get(`/api/lottery/${lotteryId}`);

      if (resp.status !== 200) {
        throw new Error('Failed to fetch lottery');
      }

      setLottery({ ...resp.data.lottery });
    } catch (err: unknown) {
      toast.error('Failed to fetch lottery');
      console.error('Error fetching lottery:', err);
      setError((err as Error)?.message || 'Failed to fetch lottery');
      setLottery(null); // Explicitly set to null if not found
    } finally {
      setLoading(false);
    }
  }, [lotteryId]);

  const refreshLottery = useCallback(async () => {
    setError(undefined);
    return getLottery();
  }, [getLottery]);

  useEffect(() => {
    getLottery();
  }, [getLottery]);

  return {
    getLottery,
    refreshLottery,
    lottery,
    loading,
    error
  };
}
