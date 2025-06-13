import { useAuth } from '@/components/providers/auth/useAuth';
import axiosInstance from '@/lib/axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useHasAccountOnChain } from './useHasAccountOnChain';

export function useCreditsBalance(intervalMs: number = 30000) {
  const { isAuthenticated } = useAuth();
  const { hasAccount } = useHasAccountOnChain(intervalMs);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await axiosInstance.get(`/api/lottery/my-balance`);
      if (resp.status !== 200) {
        throw new Error('Failed to fetch balance');
      }
      setBalance(resp.data.balance);
    } catch (err: unknown) {
      toast.error('Failed to fetch balance');
      setError((err as Error)?.message || 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, []);

  const savedCallback = useRef(fetchBalance);

  // Keep latest version of callback
  useEffect(() => {
    savedCallback.current = fetchBalance;
  }, [fetchBalance]);

  // Fetch balance initially and then on interval, only if authenticated
  useEffect(() => {
    if (!isAuthenticated || !hasAccount) return;
    savedCallback.current(); // initial fetch
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [hasAccount, intervalMs, isAuthenticated]);

  return {
    balance,
    loading,
    error,
    refresh: hasAccount ? fetchBalance : () => {}
  };
}
