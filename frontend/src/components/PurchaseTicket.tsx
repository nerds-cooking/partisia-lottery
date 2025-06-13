'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEnterLottery } from '@/hooks/useEnterLottery';
import { usePurchaseTickets } from '@/hooks/usePurchaseTickets';
import { LotteryStatusD } from '@/lib/LotteryApiGenerated';
import { Check, Lock, Shield, Ticket } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { Lottery } from '../types';
import { usePartisia } from './providers/partisia/usePartisia';
import { useSettings } from './providers/setting/useSettings';

interface PurchaseTicketProps {
  lottery: Lottery;
}

const PurchaseTicket: React.FC<PurchaseTicketProps> = ({ lottery }) => {
  const { isConnected, sdk } = usePartisia();
  const { settings } = useSettings();
  const [ticketCount, setTicketCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [entryTxn, setEntryTxn] = useState<string>('');
  const purchaseTickets = usePurchaseTickets(lottery.lotteryId);
  const { enterLottery } = useEnterLottery();

  const totalCost = ticketCount * Number(lottery.entryCost);

  const tokenSymbol =
    settings?.find((s) => s.name === 'tokenSymbol')?.value || 'MPC';

  const explorerUrl =
    settings?.find((s) => s.name === 'explorerUrl')?.value || '';

  if (!explorerUrl) {
    console.error('Explorer URL not found in settings');
  }

  const handlePurchase = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const txn = await purchaseTickets({
        sdk,
        settings,
        lotteryId: lottery.lotteryId,
        ticketCount
      });

      const entryTxnStr = typeof txn === 'string' ? txn : '';
      setEntryTxn(entryTxnStr);

      await enterLottery({
        lotteryId: lottery.lotteryId,
        entryTxn: entryTxnStr,
        entryCost: lottery.entryCost,
        entryCount: ticketCount.toString()
      });

      setPurchaseSuccess(true);

      setTimeout(() => {
        setTicketCount(1);
        setPurchaseSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Purchase or entry failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className='bg-white/10 backdrop-blur-md border-white/20 animate-fade-in'>
        <CardContent className='p-6 text-center'>
          <p className='text-white/80 mb-4'>
            Connect your wallet to purchase tickets
          </p>
          <Button disabled className='bg-gray-500'>
            Connect Wallet Required
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-white/10 backdrop-blur-md border-white/20 animate-fade-in ${purchaseSuccess ? 'animate-success-pulse' : ''}`}
    >
      <CardHeader>
        <CardTitle className='text-white flex items-center space-x-2'>
          <Ticket className='h-5 w-5' />
          <span>
            {purchaseSuccess ? 'Purchase Successful!' : 'Purchase Tickets'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {purchaseSuccess ? (
          <div className='text-center py-6 space-y-4'>
            <div className='bg-green-500/20 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center'>
              <Check className='h-8 w-8 text-green-400' />
            </div>
            <p className='text-white'>
              You've successfully purchased {ticketCount} ticket
              {ticketCount > 1 ? 's' : ''}!
            </p>
            {entryTxn && (
              <div className='flex flex-col items-center space-y-2'>
                <p className='text-white/80 text-sm'>
                  Transaction ID:{' '}
                  <span className='font-mono'>
                    {entryTxn.slice(0, 6)}...{entryTxn.slice(-6)}
                  </span>
                </p>
                <Button
                  size='sm'
                  variant='outline'
                  className='text-xs'
                  onClick={() =>
                    window.open(
                      `${explorerUrl.replace(/\/$/, '')}/transactions/${entryTxn}`,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                >
                  View on Explorer
                </Button>
              </div>
            )}
            <p className='text-white/60 text-sm'>
              Your tickets are now securely stored and privacy-protected by MPC
              technology.
            </p>
          </div>
        ) : (
          <>
            <Alert className='bg-blue-500/20 border-blue-500/30'>
              <Shield className='h-4 w-4' />
              <AlertDescription className='text-white/80'>
                Your ticket purchase is protected by MPC technology. Your
                participation remains private until the draw is complete.
              </AlertDescription>
            </Alert>

            <div className='space-y-2'>
              <Label htmlFor='ticketCount' className='text-white'>
                Number of Tickets
              </Label>
              <Input
                id='ticketCount'
                type='number'
                min='1'
                max='10'
                value={ticketCount}
                onChange={(e) =>
                  setTicketCount(
                    Math.max(1, Number.parseInt(e.target.value) || 1)
                  )
                }
                className='bg-white/10 border-white/20 text-white transition-all focus:ring-2 focus:ring-purple-500/50'
              />
            </div>

            <div className='bg-white/5 rounded-lg p-4 space-y-2'>
              <div className='flex justify-between text-white/80'>
                <span>Ticket Price:</span>
                <span>
                  {lottery.entryCost} {tokenSymbol}
                </span>
              </div>
              <div className='flex justify-between text-white/80'>
                <span>Quantity:</span>
                <span>{ticketCount}</span>
              </div>
              <div className='border-t border-white/20 pt-2 flex justify-between text-white font-semibold'>
                <span>Total Cost:</span>
                <span className='animate-pulse-slow'>
                  {totalCost} {tokenSymbol}
                </span>
              </div>
            </div>

            <div className='flex items-center space-x-2 text-white/60 text-sm'>
              <Lock className='h-4 w-4' />
              <span>Privacy-protected transaction</span>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={isLoading || lottery.status !== LotteryStatusD.Open}
              className='w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 button-gradient'
            >
              {isLoading ? (
                <div className='flex items-center space-x-2'>
                  <div className='loading-spinner w-5 h-5'></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Purchase ${ticketCount} Ticket${ticketCount > 1 ? 's' : ''}`
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PurchaseTicket;
