import LotteryPreview from '@/components/LotteryPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LotteryStatusD } from '@/lib/LotteryApiGenerated';
import { Lottery } from '@/types';
import { Coins } from 'lucide-react';
import React from 'react';

interface CreateLotteryPreviewProps {
  formData: Record<
    'name' | 'description' | 'prizePool' | 'ticketPrice' | 'duration',
    string
  >;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  setStep: (step: 'form' | 'preview' | 'success') => void;
}

const CreateLotteryPreview: React.FC<CreateLotteryPreviewProps> = ({
  formData,
  isSubmitting,
  handleSubmit,
  setStep
}) => {
  const previewLottery: Partial<Lottery> = {
    lotteryId: 'preview',
    name: formData.name,
    description: formData.description,
    prizePool: formData.prizePool,
    entryCost: formData.ticketPrice,
    status: LotteryStatusD.Open,
    createdAt: new Date().toISOString(),
    deadline: new Date(
      Date.now() + Number(formData.duration) * 60 * 60 * 1000
    ).toISOString()
  };

  return (
    <div className='space-y-8 animate-fade-in'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold text-white mb-2'>
          Preview Your Lottery
        </h1>
        <p className='text-white/70'>
          Review your lottery details before creating
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2'>
          <LotteryPreview lottery={previewLottery} />
        </div>

        <div className='space-y-6'>
          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardHeader>
              <CardTitle className='text-white flex items-center space-x-2'>
                <Coins className='h-5 w-5' />
                <span>Lottery Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-white/60'>Prize Pool:</span>
                  <span className='text-white font-semibold'>
                    {formData.prizePool} TT
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-white/60'>Ticket Price:</span>
                  <span className='text-white font-semibold'>
                    {formData.ticketPrice} TT
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-white/60'>Duration:</span>
                  <span className='text-white font-semibold'>
                    {formData.duration} hours
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-white/60'>End Date:</span>
                  <span className='text-white font-semibold'>
                    {new Date(
                      Date.now() + Number(formData.duration) * 60 * 60 * 1000
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className='pt-4 space-y-4'>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className='w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                >
                  {isSubmitting ? (
                    <div className='flex items-center space-x-2'>
                      <div className='loading-spinner w-5 h-5'></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Lottery'
                  )}
                </Button>
                <Button
                  onClick={() => setStep('form')}
                  variant='outline'
                  className='w-full border-white/20 text-white hover:bg-white/10'
                  disabled={isSubmitting}
                >
                  <span className='flex items-center'>
                    <span className='mr-2'>←</span>Edit Details
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateLotteryPreview;
