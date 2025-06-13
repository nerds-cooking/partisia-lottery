import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClaimPrize } from '@/hooks/useClaimPrize';
import { BN } from '@partisiablockchain/abi-client';
import { Ticket } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { Lottery } from '../types';
import { usePartisia } from './providers/partisia/usePartisia';
import { useSettings } from './providers/setting/useSettings';

interface ClaimPrizeFormProps {
  lottery: Lottery;
}

const ClaimPrizeForm: React.FC<ClaimPrizeFormProps> = ({ lottery }) => {
  const { settings } = useSettings();
  const { sdk } = usePartisia();
  const claimPrize = useClaimPrize();
  const [isLoading, setIsLoading] = useState(false);

  const onClaim = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!sdk || !settings) {
        console.error('SDK or settings not available');
        setIsLoading(false);
        return;
      }

      await claimPrize({
        sdk,
        settings,
        lotteryId: new BN(lottery.lotteryId)
      });
    } catch (error) {
      console.error('Error claiming prize lottery:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, settings, claimPrize, lottery.lotteryId]);

  return (
    <Card className='bg-white/10 backdrop-blur-md border-white/20 animate-fade-in'>
      <CardHeader>
        <CardTitle className='text-white flex items-center space-x-2'>
          <Ticket className='h-6 w-6 text-yellow-400 animate-bounce' />
          <span className='font-bold'>Claim Your Prize</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 text-center'>
        <p className='text-white/80 mb-2 text-lg font-semibold'>
          Congratulations! You are the winner of this lottery.
        </p>
        <p className='text-white/60 mb-4'>
          Click below to claim your prize and celebrate your luck!
        </p>
        <Button
          className='bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 text-white font-bold'
          onClick={onClaim}
          disabled={isLoading}
        >
          {isLoading ? 'Claiming...' : 'Claim Prize'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClaimPrizeForm;
