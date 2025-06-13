import axiosInstance from '@/lib/axios';
import { LotteryStatusD } from '@/lib/LotteryApiGenerated';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Lottery } from './useLottery';

export function useLotteries(
  initialPage = 1,
  initialLimit = 10,
  status?: LotteryStatusD
) {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | void>(void 0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const getLotteries = useCallback(
    async (pageArg?: number, limitArg?: number, statusArg?: LotteryStatusD) => {
      try {
        setLoading(true);
        const resp = await axiosInstance.get('/api/lottery', {
          params: {
            page: pageArg ?? page,
            limit: limitArg ?? limit,
            ...(typeof statusArg !== 'undefined'
              ? { status: statusArg }
              : typeof status !== 'undefined'
                ? { status }
                : {})
          }
        });

        if (resp.status !== 200) {
          throw new Error('Failed to fetch lotteries');
        }

        setLotteries(resp.data.lotteries || []);
        if (typeof resp.data.total === 'number') {
          setTotal(resp.data.total);
        } else {
          setTotal((resp.data.lotteries || []).length);
        }
      } catch (err: unknown) {
        toast.error('Failed to fetch lotteries');
        console.error('Error fetching lotteries:', err);
        setError((err as Error)?.message || 'Failed to fetch lotteries');
        setLotteries([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, status]
  );

  const refreshLotteries = useCallback(async () => {
    setError(undefined);
    return getLotteries();
  }, [getLotteries]);

  useEffect(() => {
    getLotteries(page, limit, status);
  }, [getLotteries, page, limit, status]);

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const setPageNumber = (p: number) => setPage(p);
  const setPageLimit = (l: number) => setLimit(l);

  return {
    lotteries,
    loading,
    error,
    page,
    limit,
    total,
    nextPage,
    prevPage,
    setPage: setPageNumber,
    setLimit: setPageLimit,
    refreshLotteries,
    getLotteries
  };
}
