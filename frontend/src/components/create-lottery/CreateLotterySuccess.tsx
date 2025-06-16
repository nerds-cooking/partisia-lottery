import Confetti from '@/components/Confetti';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, Trophy } from 'lucide-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type FormField =
  | 'name'
  | 'description'
  | 'prizePool'
  | 'ticketPrice'
  | 'duration';

interface CreateLotterySuccessProps {
  formData: Record<FormField, string>;
  showConfetti: boolean;
  handleConfettiComplete: () => void;
  lotteryId?: string;
}

const CreateLotterySuccess: React.FC<CreateLotterySuccessProps> = ({
  formData,
  showConfetti,
  handleConfettiComplete,
  lotteryId
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!showConfetti && lotteryId) {
      // navigate to details or dashboard, as needed
      // navigate(`/lottery/${lotteryId}`);
    }
  }, [showConfetti, lotteryId, navigate]);
  return (
    <>
      <Confetti
        active={showConfetti}
        duration={4000}
        particleCount={200}
        onComplete={handleConfettiComplete}
      />

      <div className='max-w-2xl mx-auto text-center space-y-8 animate-fade-in'>
        <div className='relative'>
          <div className='bg-green-500/20 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center'>
            <CheckCircle className='h-12 w-12 text-green-400' />
          </div>
          <div className='absolute inset-0 bg-green-400/30 rounded-full blur-xl animate-pulse-slow'></div>
        </div>

        <div className='space-y-4'>
          <h1 className='text-3xl font-bold text-white'>
            <span className='bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent'>
              Lottery Created Successfully!
            </span>
          </h1>
          <p className='text-white/80 text-lg'>
            Your lottery has been created and is now live on the platform.
          </p>
        </div>

        <div className='bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20'>
          <div className='space-y-4'>
            <div className='flex items-center justify-center space-x-2'>
              <Trophy className='h-5 w-5 text-yellow-400' />
              <h3 className='text-xl font-semibold text-white'>
                {formData.name}
              </h3>
            </div>
            <p className='text-white/70'>{formData.description}</p>
            <div className='flex justify-center space-x-6'>
              <div className='text-center'>
                <p className='text-white/60 text-sm'>Prize Pool</p>
                <p className='text-white font-bold'>
                  {formData.prizePool} Credits
                </p>
              </div>
              <div className='text-center'>
                <p className='text-white/60 text-sm'>Ticket Price</p>
                <p className='text-white font-bold'>
                  {formData.ticketPrice} Credits
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-4 justify-center pt-4'>
          <Button
            disabled={!lotteryId}
            onClick={() => lotteryId && navigate(`/lottery/${lotteryId}`)}
            className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
          >
            <Sparkles className='h-4 w-4 mr-2' />
            View Your Lottery
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            variant='outline'
            className='border-white/20 text-white hover:bg-white/10'
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </>
  );
};

export default CreateLotterySuccess;
