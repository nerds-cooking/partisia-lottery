import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  CheckCircle,
  Clock,
  Coins,
  FileText,
  Sparkles,
  Tag,
  Trophy
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

type FormField =
  | 'name'
  | 'description'
  | 'prizePool'
  | 'ticketPrice'
  | 'duration';

interface CreateLotteryFormProps {
  formData: Record<FormField, string>;
  errors: Record<FormField, string>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setStep: (step: 'form' | 'preview' | 'success') => void;
  validateForm: () => boolean;
}

const CreateLotteryForm: React.FC<CreateLotteryFormProps> = ({
  formData,
  errors,
  handleChange,
  handleSubmit,
  setStep,
  validateForm
}) => {
  const navigate = useNavigate();
  return (
    <>
      <div className='text-center mb-4'>
        <h1 className='text-3xl font-bold text-white mb-2'>
          Create a New Lottery
        </h1>
        <p className='text-white/70'>
          Set up your own MPC-protected lottery with custom parameters
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='grid grid-cols-1 lg:grid-cols-3 gap-8'
      >
        <div className='lg:col-span-2 space-y-6'>
          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardHeader>
              <CardTitle className='text-white flex items-center space-x-2'>
                <FileText className='h-5 w-5' />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name' className='text-white'>
                  Lottery Name
                </Label>
                <Input
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  placeholder='Weekly Mega Draw'
                  className='bg-white/10 border-white/20 text-white'
                />
                {errors.name && (
                  <p className='text-red-400 text-sm'>{errors.name}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description' className='text-white'>
                  Description
                </Label>
                <textarea
                  id='description'
                  name='description'
                  value={formData.description}
                  onChange={handleChange}
                  placeholder='Describe your lottery and what makes it special...'
                  rows={4}
                  className='w-full rounded-md bg-white/10 border border-white/20 text-white p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50'
                />
                {errors.description && (
                  <p className='text-red-400 text-sm'>{errors.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardHeader>
              <CardTitle className='text-white flex items-center space-x-2'>
                <Coins className='h-5 w-5' />
                <span>Economics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='prizePool' className='text-white'>
                    Prize Pool (Credits)
                  </Label>
                  <Input
                    id='prizePool'
                    name='prizePool'
                    type='number'
                    value={formData.prizePool}
                    onChange={handleChange}
                    min='5'
                    className='bg-white/10 border-white/20 text-white'
                  />
                  {errors.prizePool && (
                    <p className='text-red-400 text-sm'>{errors.prizePool}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='ticketPrice' className='text-white'>
                    Ticket Price (Credits)
                  </Label>
                  <Input
                    id='ticketPrice'
                    name='ticketPrice'
                    type='number'
                    value={formData.ticketPrice}
                    onChange={handleChange}
                    min='1'
                    className='bg-white/10 border-white/20 text-white'
                  />
                  {errors.ticketPrice && (
                    <p className='text-red-400 text-sm'>{errors.ticketPrice}</p>
                  )}
                </div>
              </div>

              <Alert className='bg-blue-500/20 border-blue-500/30'>
                <Trophy className='h-4 w-4' />
                <AlertDescription className='text-white/80'>
                  With these settings, you'll need at least{' '}
                  {Math.ceil(
                    Number(formData.prizePool) / Number(formData.ticketPrice)
                  )}{' '}
                  tickets sold to cover the prize pool.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardHeader>
              <CardTitle className='text-white flex items-center space-x-2'>
                <Calendar className='h-5 w-5' />
                <span>Timing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='duration' className='text-white'>
                  Duration (hours)
                </Label>
                <div className='flex items-center space-x-4'>
                  <Input
                    id='duration'
                    name='duration'
                    type='number'
                    value={formData.duration}
                    onChange={handleChange}
                    min='1'
                    max='720'
                    className='bg-white/10 border-white/20 text-white'
                  />
                  <div className='text-white/60 whitespace-nowrap'>
                    <Clock className='h-4 w-4 inline mr-1' />
                    {formData.duration} hours
                  </div>
                </div>
                {errors.duration && (
                  <p className='text-red-400 text-sm'>{errors.duration}</p>
                )}
              </div>

              <div className='pt-2'>
                <p className='text-white/60 text-sm'>
                  Your lottery will end on:{' '}
                  <span className='text-white'>
                    {new Date(
                      Date.now() + Number(formData.duration) * 60 * 60 * 1000
                    ).toLocaleString()}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardHeader>
              <CardTitle className='text-white flex items-center space-x-2'>
                <Tag className='h-5 w-5' />
                <span>Featured Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-lg p-8 text-center border border-white/10'>
                  <div className='text-white/60 mb-2'>
                    <Trophy className='h-12 w-12 mx-auto mb-2 text-yellow-400' />
                    <p>Default Lottery Image</p>
                  </div>
                </div>
                <p className='text-white/60 text-sm text-center'>
                  Custom images coming soon!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white/10 backdrop-blur-md border-white/20'>
            <CardHeader>
              <CardTitle className='text-white flex items-center space-x-2'>
                <Sparkles className='h-5 w-5' />
                <span>MPC Protection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <p className='text-white/80'>
                  Your lottery will be protected by Multi-Party Computation
                  technology, ensuring:
                </p>
                <ul className='space-y-2 text-white/70'>
                  <li className='flex items-start space-x-2'>
                    <CheckCircle className='h-4 w-4 text-green-400 mt-1' />
                    <span>Tamper-proof random number generation</span>
                  </li>
                  <li className='flex items-start space-x-2'>
                    <CheckCircle className='h-4 w-4 text-green-400 mt-1' />
                    <span>Privacy for all participants</span>
                  </li>
                  <li className='flex items-start space-x-2'>
                    <CheckCircle className='h-4 w-4 text-green-400 mt-1' />
                    <span>Transparent and verifiable results</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className='space-y-4'>
            <Button
              type='button'
              onClick={() => {
                if (validateForm()) {
                  setStep('preview');
                  scrollTo(0, 0);
                }
              }}
              className='w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
            >
              Preview Lottery
            </Button>
            <Button
              type='button'
              onClick={() => navigate('/dashboard')}
              variant='outline'
              className='w-full border-white/20 text-white hover:bg-white/10'
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};

export default CreateLotteryForm;
