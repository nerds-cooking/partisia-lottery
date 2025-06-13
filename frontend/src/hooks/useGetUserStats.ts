import axiosInstance from '@/lib/axios';
import { useEffect, useState } from 'react';

export function useGetUserStats() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    totalWins: string;
    totalTickets: string;
    totalSpent: string;
  }>({
    totalWins: '0',
    totalTickets: '0',
    totalSpent: '0'
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    axiosInstance
      .get('/api/lottery/user-stats')
      .then((resp) => {
        if (isMounted) {
          if (resp.status === 200) {
            setData(resp.data);
          } else {
            setError('Failed to fetch user stats');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || 'Failed to fetch user stats');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { loading, error, data };
}
