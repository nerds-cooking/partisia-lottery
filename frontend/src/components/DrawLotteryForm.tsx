import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDrawLottery } from '@/hooks/useDrawLottery';
import { BN } from '@partisiablockchain/abi-client';
import { Ticket } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { Lottery } from '../types';
import { usePartisia } from './providers/partisia/usePartisia';
import { useSettings } from './providers/setting/useSettings';

interface DrawLotteryFormProps {
  lottery: Lottery;
  refresh: () => void;
}

const DrawLotteryForm: React.FC<DrawLotteryFormProps> = ({
  lottery,
  refresh
}) => {
  const { settings } = useSettings();
  const { sdk } = usePartisia();
  const drawLottery = useDrawLottery();
  const [isLoading, setIsLoading] = useState(false);

  const onDraw = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!sdk || !settings) {
        console.error('SDK or settings not available');
        setIsLoading(false);
        return;
      }

      await drawLottery({
        sdk,
        settings,
        lotteryId: new BN(lottery.lotteryId)
      });

      refresh();
    } catch (error) {
      console.error('Error drawing lottery:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, settings, drawLottery, lottery.lotteryId, refresh]);

  return (
    <Card className='bg-white/10 backdrop-blur-md border-white/20 animate-fade-in'>
      <CardHeader>
        <CardTitle className='text-white flex items-center space-x-2'>
          <Ticket className='h-5 w-5 text-yellow-400' />
          <span>Draw Lottery</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 text-center'>
        <p className='text-white/80 mb-4'>
          The deadline has passed. You can now draw the lottery to determine the
          winner.
        </p>
        <Button
          className='bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 text-white font-bold'
          onClick={onDraw}
          disabled={isLoading}
        >
          {isLoading ? 'Drawing...' : 'Draw Lottery'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DrawLotteryForm;
