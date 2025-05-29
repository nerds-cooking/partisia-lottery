'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Shield, Trophy, Users } from 'lucide-react';
import type React from 'react';
import type { Lottery } from '../types';
import CountdownTimer from './CountdownTimer';

interface LotteryCardProps {
  lottery: Lottery;
  onClick?: () => void;
  index?: number;
}

const LotteryCard: React.FC<LotteryCardProps> = ({
  lottery,
  onClick,
  index = 0
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'drawing':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'drawing':
        return 'Drawing in Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  // Calculate animation values directly based on index
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
            <span className='text-sm'>{lottery.prizePool} MPC</span>
          </div>
          <div className='flex items-center space-x-1'>
            <Users className='h-4 w-4' />
            <span className='text-sm'>{lottery.participants} participants</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        <p className='text-white/80 text-sm'>{lottery.description}</p>

        {lottery.status === 'active' && (
          <div className='space-y-2'>
            <div className='flex items-center space-x-2 text-white/60'>
              <Clock className='h-4 w-4' />
              <span className='text-sm'>Draw in:</span>
            </div>
            <CountdownTimer endTime={lottery.endTime} />
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
              {lottery.ticketPrice} MPC
            </span>
          </div>
          <Button
            onClick={onClick}
            className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 button-gradient'
            disabled={lottery.status !== 'active'}
          >
            {lottery.status === 'active' ? 'Enter Lottery' : 'View Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LotteryCard;
