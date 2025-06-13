import { useAuth } from '@/components/providers/auth/useAuth';
import axiosInstance from '@/lib/axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export function useHasAccountOnChain(intervalMs: number = 30000) {
  const { isAuthenticated } = useAuth();
  const [hasAccount, setHasAccount] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHasAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await axiosInstance.get(`/api/user/has-account`);
      if (resp.status !== 200) {
        throw new Error('Failed to check account status');
      }
      setHasAccount(resp.data.hasAccount);
    } catch (err: unknown) {
      toast.error('Failed to check account status');
      setError((err as Error)?.message || 'Failed to check account status');
    } finally {
      setLoading(false);
    }
  }, []);

  const savedCallback = useRef(fetchHasAccount);

  useEffect(() => {
    savedCallback.current = fetchHasAccount;
  }, [fetchHasAccount]);

  useEffect(() => {
    if (!isAuthenticated) return;
    savedCallback.current();
    let id: NodeJS.Timeout | null = null;
    if (!hasAccount) {
      id = setInterval(() => {
        if (!hasAccount) {
          savedCallback.current();
        } else if (id) {
          clearInterval(id);
        }
      }, intervalMs);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [intervalMs, isAuthenticated, hasAccount]);

  return { hasAccount, loading, error, refresh: fetchHasAccount };
}
