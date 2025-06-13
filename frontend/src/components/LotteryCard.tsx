'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LotteryStatusD } from '@/lib/LotteryApiGenerated';
import { getStatusColor, getStatusText } from '@/utils/status';
import { Clock, Shield, Trophy, Users } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Lottery } from '../types';
import CountdownTimer from './CountdownTimer';
import { useSettings } from './providers/setting/useSettings';

interface LotteryCardProps {
  lottery: Lottery;
  index?: number;
}

const LotteryCard: React.FC<LotteryCardProps> = ({ lottery, index = 0 }) => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const tokenSymbol = useMemo(
    () =>
      settings?.find((setting) => setting.name === 'tokenSymbol')?.value ||
      'MPC',
    [settings]
  );

  const animationDelay = `${Math.min((index % 5) * 0.2 + 0.2, 1.0)}s`;

  return (
    <Card
      className='bg-white/10 backdrop-blur-md border-white/20 hover-lift card-hover'
      style={{
        animation: `fadeInUp 0.6s ease-out forwards`,
        animationDelay,
        opacity: 0,
        transform: 'translateY(20px)'
      }}
    >
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-white'>{lottery.name}</CardTitle>
          <Badge className={`${getStatusColor(lottery.status)} text-white`}>
            {getStatusText(lottery.status)}
          </Badge>
        </div>
        <div className='flex items-center space-x-4 text-white/60'>
          <div className='flex items-center space-x-1'>
            <Trophy className='h-4 w-4' />
            <span className='text-sm'>
              {lottery.prizePool} {tokenSymbol}
            </span>
          </div>
          <div className='flex items-center space-x-1'>
            <Users className='h-4 w-4' />
            <span className='text-sm'>{0} participants</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        <p className='text-white/80 text-sm'>{lottery.description}</p>

        {lottery.status === LotteryStatusD.Open && (
          <div className='space-y-2'>
            <div className='flex items-center space-x-2 text-white/60'>
              <Clock className='h-4 w-4' />
              <span className='text-sm'>Draw in:</span>
            </div>
            <CountdownTimer endTime={new Date(lottery.deadline)} />
          </div>
        )}

        <div className='flex items-center space-x-2 text-white/60'>
          <Shield className='h-4 w-4' />
          <span className='text-sm'>MPC-Protected Draw</span>
        </div>

        <div className='flex items-center justify-between'>
          <div className='text-white/60'>
            <span className='text-sm'>Ticket Price: </span>
            <span className='text-white font-semibold'>
              {lottery.entryCost} {tokenSymbol}
            </span>
          </div>
          <Button
            onClick={() => navigate(`/lottery/${lottery.lotteryId}`)}
            className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 button-gradient'
            disabled={lottery.status !== LotteryStatusD.Open}
          >
            {lottery.status === LotteryStatusD.Open
              ? 'Enter Lottery'
              : 'View Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LotteryCard;
