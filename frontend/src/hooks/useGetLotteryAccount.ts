import axiosInstance from '@/lib/axios';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useGetLotteryAccount(lotteryId: string) {
  const [lotteryAccount, setLotteryAccount] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLotteryAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await axiosInstance.get(`/api/lottery/${lotteryId}/account`);
      if (resp.status !== 200) {
        throw new Error('Failed to fetch lottery account');
      }
      setLotteryAccount(resp.data.lotteryAccount);
    } catch (err: unknown) {
      toast.error('Failed to fetch lottery account');
      setError((err as Error)?.message || 'Failed to fetch lottery account');
    } finally {
      setLoading(false);
    }
  }, [lotteryId]);

  useEffect(() => {
    fetchLotteryAccount();
  }, [fetchLotteryAccount]);

  return {
    lotteryAccount,
    loading,
    error,
    refresh: fetchLotteryAccount
  };
}
