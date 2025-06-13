import axiosInstance from '@/lib/axios';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useGetUserEntries(initialPage = 1, initialLimit = 10) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const fetchUserEntries = useCallback(
    async (pageOverride?: number, limitOverride?: number) => {
      try {
        setLoading(true);
        setError(null);
        const pageToFetch = pageOverride ?? page;
        const limitToFetch = limitOverride ?? limit;
        const resp = await axiosInstance.get(`/api/lottery/entries`, {
          params: { page: pageToFetch, limit: limitToFetch }
        });
        if (resp.status !== 200) {
          throw new Error('Failed to fetch lottery account');
        }
        setEntries(resp?.data?.entries || []);
        setTotal(resp?.data?.total || 0);
        setPage(resp?.data?.page || pageToFetch);
        setLimit(resp?.data?.limit || limitToFetch);
      } catch (err: unknown) {
        toast.error('Failed to fetch lottery account');
        setError((err as Error)?.message || 'Failed to fetch lottery account');
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchUserEntries();
  }, [fetchUserEntries]);

  const nextPage = useCallback(() => {
    if (page * limit < total) {
      fetchUserEntries(page + 1, limit);
    }
  }, [page, limit, total, fetchUserEntries]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      fetchUserEntries(page - 1, limit);
    }
  }, [page, limit, fetchUserEntries]);

  return {
    entries,
    loading,
    error,
    page,
    limit,
    total,
    nextPage,
    prevPage,
    setPage: (p: number) => fetchUserEntries(p, limit),
    setLimit: (l: number) => fetchUserEntries(1, l),
    refresh: fetchUserEntries
  };
}
