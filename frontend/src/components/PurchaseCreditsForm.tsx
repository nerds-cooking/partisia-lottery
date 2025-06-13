import { usePartisia } from '@/components/providers/partisia/usePartisia';
import { useSettings } from '@/components/providers/setting/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePurchaseCredits } from '@/hooks/usePurchaseCredits';
import { Coins } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface PurchaseCreditsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function PurchaseCreditsForm({
  onSuccess,
  onCancel,
  className
}: PurchaseCreditsFormProps) {
  const purchaseCredits = usePurchaseCredits();
  const { settings } = useSettings();
  const { sdk } = usePartisia();
  const [amount, setAmount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    setErrorDetails(null);
    try {
      await purchaseCredits({
        sdk,
        settings,
        purchaseCreditsAmount: amount,
        setStatus,
        setErrorDetails
      });
      toast.success('Credits purchased!');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(
        (err instanceof Error ? err.message : String(err)) ||
          'Failed to purchase credits'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`bg-white/10 backdrop-blur-md border-white/20 ${className || ''}`}
    >
      <CardHeader>
        <CardTitle className='text-white flex items-center space-x-2'>
          <Coins className='h-5 w-5' />
          <span>Purchase Credits</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <form onSubmit={handlePurchase} className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='amount' className='text-white'>
              Amount to purchase
            </Label>
            <Input
              id='amount'
              type='number'
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className='bg-white/10 border-white/20 text-white'
              required
            />
          </div>
          <div className='flex flex-row gap-2 justify-between'>
            <Button
              type='button'
              className='bg-white/30 backdrop-blur-sm text-white border border-white/20 hover:bg-white/40 rounded-md'
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='w-auto bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-2 rounded-md'
              disabled={loading}
            >
              {loading ? 'Purchasing...' : 'Purchase Credits'}
            </Button>
          </div>
          {status && <div className='text-white text-sm mt-2'>{status}</div>}
          {errorDetails && (
            <div className='text-red-400 text-sm mt-2 whitespace-pre-wrap'>
              {errorDetails}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
