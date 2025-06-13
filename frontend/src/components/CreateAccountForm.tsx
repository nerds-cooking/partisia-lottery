import { usePartisia } from '@/components/providers/partisia/usePartisia';
import { useSettings } from '@/components/providers/setting/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAccount } from '@/hooks/useCreateAccount';
import { RefreshCcw, User2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface CreateAccountFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function CreateAccountForm({
  onSuccess,
  onCancel,
  className
}: CreateAccountFormProps) {
  const generateRandomNumber = () =>
    Math.floor(100000000 + Math.random() * 900000000).toString();
  const [accountNumber, setAccountNumber] = useState(generateRandomNumber());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const createAccount = useCreateAccount();
  const { sdk } = usePartisia();
  const { settings } = useSettings();

  useEffect(() => {
    setAccountNumber(generateRandomNumber());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    setErrorDetails(null);
    try {
      if (!accountNumber.trim() || isNaN(Number(accountNumber))) {
        setError('A valid random number is required');
        setLoading(false);
        return;
      }
      await createAccount({
        sdk,
        settings,
        accountNumber: Number(accountNumber),
        setStatus,
        setErrorDetails
      });
      toast.success('Account created!');
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError('Failed to create account: ' + error.message);
      } else {
        setError('Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`bg-white/10 backdrop-blur-md border border-white/10 shadow-xl ${className || ''}`}
    >
      <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
        <CardHeader>
          <CardTitle className='text-white text-lg font-semibold flex items-center gap-2'>
            <User2Icon className='w-4 h-4' />
            <span>Create Account</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='accountNumber' className='text-white'>
              Account Number
            </Label>
            <div className='flex gap-2 items-center'>
              <Input
                id='accountNumber'
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder='Enter a random number'
                className='bg-white/20 backdrop-blur-md border-white/20 text-white placeholder:text-white/60'
                disabled={loading}
                autoFocus
                type='number'
              />
              <Button
                type='button'
                variant='secondary'
                className='p-2 h-10 w-10 flex items-center justify-center'
                onClick={() => setAccountNumber(generateRandomNumber())}
                disabled={loading}
                title='Generate random number'
              >
                <RefreshCcw className='w-5 h-5' />
              </Button>
            </div>
            {error && (
              <span className='text-red-400 text-sm mt-1'>{error}</span>
            )}
          </div>
          {status && <div className='text-white text-sm mt-2'>{status}</div>}
          {errorDetails && (
            <div className='text-red-400 text-sm mt-2 whitespace-pre-wrap'>
              {errorDetails}
            </div>
          )}
          <div className='flex flex-row gap-2 mt-4'>
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
