import CountdownTimer from '@/components/CountdownTimer';
import LoadingSpinner from '@/components/LoadingSpinner';
import MPCExplanation from '@/components/MPCExplanation';
import { useLottery } from '@/components/providers/lottery/useLottery';
import { useSettings } from '@/components/providers/setting/useSettings';
import PurchaseTicket from '@/components/PurchaseTicket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LotteryStatusD } from '@/lib/LotteryApiGenerated';
import { getStatusColor, getStatusText } from '@/utils/status';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Hash,
  RefreshCcw,
  Sparkles,
  Trophy,
  Users
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function LotteryViewPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { lotteryId } = useParams<{ lotteryId: string }>();

  const tokenSymbol = useMemo(
    () =>
      settings?.find((setting) => setting.name === 'tokenSymbol')?.value ||
      'MPC',
    [settings]
  );

  const { lottery, loading, error, refreshLottery } = useLottery(
    lotteryId || '0'
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <LoadingSpinner text='Loading Lottery...' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <h1 className='text-3xl font-bold text-red-400 mb-4'>
          Error Loading Lottery
        </h1>
        <p className='text-white/60 mb-6'>{error}</p>
        <Button
          onClick={refreshLottery}
          className='bg-gradient-to-r from-purple-500 to-blue-500'
        >
          <RefreshCcw className='h-4 w-4 mr-2' />
          Retry
        </Button>
      </div>
    );
  }

  if (!lotteryId || !lottery) {
    return (
      <div className='text-center py-12'>
        <h1 className='text-3xl font-bold text-white mb-4'>
          Lottery Not Found
        </h1>
        <p className='text-white/60 mb-6'>
          The lottery you're looking for doesn't exist.
        </p>
        <Button
          onClick={() => navigate('/')}
          className='bg-gradient-to-r from-purple-500 to-blue-500'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div className='flex items-center space-x-4 relative'>
        <Button
          onClick={() => navigate('/')}
          variant='outline'
          size='sm'
          className='border-white/20 text-white hover:bg-white/10'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back
        </Button>
        <div className='text-center space-y-4 flex-1'>
          <div className='flex items-center justify-center space-x-4'>
            <h1 className='text-3xl font-bold text-white'>{lottery.name}</h1>
            <Badge className={`${getStatusColor(lottery.status)} text-white`}>
              {getStatusText(lottery.status)}
            </Badge>
            {lottery.status === LotteryStatusD.Complete && (
              <Sparkles className='h-6 w-6 text-yellow-400 animate-pulse-slow' />
            )}
          </div>
          <p className='text-white/80 max-w-2xl mx-auto'>
            {lottery.description}
          </p>
        </div>
        <Button
          onClick={refreshLottery}
          variant='ghost'
          size='icon'
          className='absolute right-0 top-0 text-white hover:bg-white/10'
          title='Refresh'
        >
          <RefreshCcw className='h-5 w-5' />
        </Button>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 space-y-6'>
          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardHeader>
              <CardTitle className='text-white'>Lottery Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-3'>
                    <Trophy className='h-5 w-5 text-yellow-400' />
                    <div>
                      <p className='text-white/60 text-sm'>Prize Pool</p>
                      <p className='text-white font-semibold text-lg'>
                        {lottery.prizePool} {tokenSymbol}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-3'>
                    <Users className='h-5 w-5 text-blue-400' />
                    <div>
                      <p className='text-white/60 text-sm'>Participants</p>
                      <p className='text-white font-semibold'>{0}</p>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='flex items-center space-x-3'>
                    <Hash className='h-5 w-5 text-purple-400' />
                    <div>
                      <p className='text-white/60 text-sm'>Ticket Price</p>
                      <p className='text-white font-semibold'>
                        {lottery.entryCost} {tokenSymbol}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-3'>
                    <Calendar className='h-5 w-5 text-green-400' />
                    <div>
                      <p className='text-white/60 text-sm'>Created</p>
                      <p className='text-white font-semibold'>
                        {new Date(lottery.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {lottery.status === LotteryStatusD.Open && (
                <div className='border-t border-white/20 pt-4'>
                  <div className='flex items-center space-x-2 text-white/60 mb-2'>
                    <Clock className='h-4 w-4' />
                    <span className='text-sm'>Time Remaining</span>
                  </div>
                  <CountdownTimer endTime={new Date(lottery.deadline)} />
                </div>
              )}
            </CardContent>
          </Card>

          <MPCExplanation />
        </div>

        <div className='space-y-6'>
          {lottery.status === LotteryStatusD.Open && (
            <PurchaseTicket lottery={lottery} />
          )}

          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardHeader>
              <CardTitle className='text-white text-lg'>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-white/60'>Total Tickets Sold</span>
                <span className='text-white font-semibold'>{0 * 2}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-white/60'>Odds of Winning</span>
                <span className='text-white font-semibold'>1 in {0 * 2}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-white/60'>Entry Fee</span>
                <span className='text-white font-semibold'>
                  {lottery.entryCost} {tokenSymbol}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
