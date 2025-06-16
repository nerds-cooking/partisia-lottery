import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Shield, Trophy, Users } from 'lucide-react';
import React from 'react';
import type { Lottery } from '../types';
import CountdownTimer from './CountdownTimer';

interface LotteryPreviewProps {
  lottery: Partial<Lottery>;
}

const LotteryPreview: React.FC<LotteryPreviewProps> = ({ lottery }) => {
  return (
    <Card className='bg-white/10 backdrop-blur-md border-white/20 animate-fade-in'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-white'>{lottery.name}</CardTitle>
          <Badge className='bg-green-500 text-white'>Preview</Badge>
        </div>
        <div className='flex items-center space-x-4 text-white/60'>
          <div className='flex items-center space-x-1'>
            <Trophy className='h-4 w-4' />
            <span className='text-sm'>{lottery.prizePool} Credits</span>
          </div>
          <div className='flex items-center space-x-1'>
            <Users className='h-4 w-4' />
            <span className='text-sm'>{0} participants</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-lg p-8 text-center border border-white/10'>
          <Trophy className='h-16 w-16 text-yellow-400 mx-auto mb-4' />
          <h3 className='text-xl font-semibold text-white mb-2'>
            Win {lottery.prizePool} Credits
          </h3>
          <p className='text-white/70'>Secure, private, and fair lottery</p>
        </div>

        <p className='text-white/80'>{lottery.description}</p>

        <div className='space-y-2'>
          <div className='flex items-center space-x-2 text-white/60'>
            <Clock className='h-4 w-4' />
            <span className='text-sm'>Draw in:</span>
          </div>
          {lottery.deadline ? (
            <CountdownTimer endTime={new Date(lottery.deadline)} />
          ) : (
            <span className='text-red-400 text-sm'>No deadline set</span>
          )}
        </div>

        <div className='flex items-center space-x-2 text-white/60'>
          <Shield className='h-4 w-4' />
          <span className='text-sm'>MPC-Protected Draw</span>
        </div>

        <div className='flex items-center justify-between'>
          <div className='text-white/60'>
            <span className='text-sm'>Ticket Price: </span>
            <span className='text-white font-semibold'>
              {lottery.entryCost} Credits
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LotteryPreview;
