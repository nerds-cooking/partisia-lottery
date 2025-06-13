import axiosInstance from '@/lib/axios';
import { useCallback, useEffect, useState } from 'react';

export function useGetMyAccountKey() {
  const [accountKey, setAccountKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountKey = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await axiosInstance.get(`/api/lottery/my-account-key`);
      if (resp.status !== 200) {
        throw new Error('Failed to get account key');
      }

      setAccountKey(resp.data.accountKey);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: unknown) {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountKey();
  }, [fetchAccountKey]);

  return { accountKey, loading, error, refresh: fetchAccountKey };
}
