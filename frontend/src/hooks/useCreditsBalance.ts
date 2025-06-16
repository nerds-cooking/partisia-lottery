import { useAuth } from '@/components/providers/auth/useAuth';
import axiosInstance from '@/lib/axios';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useHasAccountOnChain } from './useHasAccountOnChain';

export function useCreditsBalance() {
  const { isAuthenticated } = useAuth();
  const { hasAccount } = useHasAccountOnChain();
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

  // Fetch balance initially only when authenticated and hasAccount
  useEffect(() => {
    if (!isAuthenticated || !hasAccount) return;
    fetchBalance();
  }, [isAuthenticated, hasAccount, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh: hasAccount ? fetchBalance : () => {}
  };
}
