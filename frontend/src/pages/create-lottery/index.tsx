import CreateLotteryForm from '@/components/create-lottery/CreateLotteryForm';
import CreateLotteryPreview from '@/components/create-lottery/CreateLotteryPreview';
import CreateLotterySuccess from '@/components/create-lottery/CreateLotterySuccess';
import { CreateAccountForm } from '@/components/CreateAccountForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePartisia } from '@/components/providers/partisia/usePartisia';
import { useSettings } from '@/components/providers/setting/useSettings';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useCreditsBalance } from '@/hooks/useCreditsBalance';
import { useGetMyAccountKey } from '@/hooks/useGetMyAccountKey';
import { useHasAccountOnChain } from '@/hooks/useHasAccountOnChain';
import axiosInstance from '@/lib/axios';
import { LotteryApi } from '@/lib/LotteryApi';
import { BN } from '@partisiablockchain/abi-client';
import { BlockchainTransactionClient } from '@partisiablockchain/blockchain-api-transaction-client';
import { Client, RealZkClient } from '@partisiablockchain/zk-client';
import { RefreshCcw } from 'lucide-react';
import { useState } from 'react';

type FormField =
  | 'name'
  | 'description'
  | 'prizePool'
  | 'ticketPrice'
  | 'duration';

export function CreateLotteryPage() {
  const { sdk } = usePartisia();
  const { settings } = useSettings();
  const [step, setStep] = useState<'form' | 'preview' | 'success' | 'account'>(
    'form'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [errors, setErrors] = useState<Record<FormField, string>>({
    name: '',
    description: '',
    prizePool: '',
    ticketPrice: '',
    duration: ''
  });
  const [formData, setFormData] = useState<Record<FormField, string>>({
    name: '',
    description: '',
    prizePool: '5',
    ticketPrice: '1',
    duration: '24'
  });
  const {
    hasAccount,
    loading: hasAccountLoading,
    refresh: refreshHasAccount
  } = useHasAccountOnChain(30000);

  const { balance, loading: isBalanceLoading } = useCreditsBalance();

  const [lotteryId, setLotteryId] = useState<BN | undefined>(undefined);

  const { accountKey: userAccountKey, loading: isAccountKeyLoading } =
    useGetMyAccountKey();

  const [isCreateAccountModalOpen, setCreateAccountModalOpen] = useState(false);

  if (isAccountKeyLoading || hasAccountLoading || isBalanceLoading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <LoadingSpinner />
      </div>
    );
  }

  // Show account creation screen before anything else if user doesn't have an account
  if (!hasAccount && step !== 'account') {
    setStep('account');
  }

  if (hasAccount && step === 'account') {
    setStep('form');
  }

  // Only check balance after account check
  if (step !== 'account' && balance === '0') {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold mb-4'>No Credits</h2>
          <p className='mb-4'>
            You need credits to create a lottery. Please add credits to your
            account.
          </p>
          <Button
            className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 font-bold px-8 py-3 text-lg rounded-lg shadow-lg text-white transition-colors duration-200'
            onClick={() => (window.location.href = '/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const typedName = name as FormField;
    setFormData((prev) => ({ ...prev, [typedName]: value }));

    if (errors[typedName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        newErrors[typedName] = '';
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Lottery name is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (Number(formData.prizePool) <= 0)
      newErrors.prizePool = 'Prize pool must be greater than 0';
    if (Number(formData.ticketPrice) <= 0)
      newErrors.ticketPrice = 'Ticket price must be greater than 0';
    if (Number(formData.duration) <= 0)
      newErrors.duration = 'Duration must be greater than 0';
    if (Number(formData.prizePool) > Number(balance))
      newErrors.prizePool = 'Insufficient credits for prize pool';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) return;

    if (!userAccountKey) return;

    try {
      const currentAccount = sdk?.connection.account;

      const contractAddress = settings?.find(
        (s) => s.name === 'contractAddress'
      )?.value;
      if (!contractAddress) {
        return;
      }

      const partisiaClientUrl = settings?.find(
        (s) => s.name === 'partisiaClientUrl'
      )?.value;
      if (!partisiaClientUrl) {
        return;
      }

      const client = new Client(partisiaClientUrl);
      const transactionClient = BlockchainTransactionClient.create(
        partisiaClientUrl,
        {
          getAddress: () => currentAccount!.address,
          sign: async (payload: Buffer) => {
            const res = await sdk!.signMessage({
              payload: payload.toString('hex'),
              payloadType: 'hex',
              dontBroadcast: true
            });
            return res.signature;
          }
        }
      );

      const zkClient = RealZkClient.create(contractAddress, client);

      const lotteryApi = new LotteryApi(
        transactionClient,
        zkClient,
        currentAccount!.address,
        contractAddress
      );

      const lotteryId = new BN(Math.floor(Math.random() * 1000000).toString());
      const deadline = new BN(
        Math.floor(Date.now() / 1000) + Number(formData.duration) * 3600
      );
      // deadline in one minte from now for testing purposes
      // const deadline = new BN(Math.floor(Date.now() / 1000) + 60);
      const entryCost = new BN(formData.ticketPrice);
      const prizePool = new BN(formData.prizePool);
      const randomSeed = new BN(Math.floor(Math.random() * 1000000).toString());
      const accountKey = new BN(userAccountKey);

      setLotteryId(lotteryId);

      const txn = await lotteryApi.createLottery(
        lotteryId,
        deadline,
        entryCost,
        prizePool,
        accountKey,
        randomSeed
      );

      await axiosInstance.post('/api/lottery', {
        lotteryId: lotteryId.toString(),
        name: formData.name,
        description: formData.description,
        prizePool: formData.prizePool,
        entryCost: formData.ticketPrice,
        deadline: new Date(deadline.toNumber() * 1000).toISOString(),
        creationTxn: txn.signedTransaction.identifier()
      });

      setShowConfetti(true);
      setStep('success');
    } catch (error) {
      console.error('Error creating lottery:', error);
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };

  return (
    <div>
      {step === 'account' && (
        <>
          <div className='flex items-center justify-center h-96'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold mb-4'>Create Lottery</h2>
              <p className='mb-4'>
                You need to create an account on the blockchain to create a
                lottery.
              </p>
              <p className='mb-6'>
                Click the button below to create your account. This will allow
                you to create and manage lotteries.
              </p>
              <div className='flex items-center justify-center gap-2 mb-2'>
                <Button
                  className='bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 font-bold px-8 py-3 text-lg rounded-lg shadow-lg text-white transition-colors duration-200'
                  onClick={() => setCreateAccountModalOpen(true)}
                >
                  Create Account
                </Button>
                <button
                  className='inline-flex items-center justify-center p-2 rounded-full bg-white/10 hover:bg-white/20 text-blue-500 transition-colors duration-200'
                  title='Refresh account status'
                  onClick={refreshHasAccount}
                  type='button'
                >
                  <RefreshCcw className='w-5 h-5' />
                </button>
              </div>
              <p className='mt-4 text-sm text-gray-400'>
                If you have just created an account, please allow a short time
                for it to update on the blockchain.
              </p>
            </div>
          </div>
          {isCreateAccountModalOpen && (
            <Dialog
              open={isCreateAccountModalOpen}
              onOpenChange={setCreateAccountModalOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create On-chain Account</DialogTitle>
                </DialogHeader>
                <CreateAccountForm
                  onSuccess={() => {
                    setCreateAccountModalOpen(false);
                    refreshHasAccount();
                  }}
                  onCancel={() => setCreateAccountModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </>
      )}

      {step === 'form' && (
        <CreateLotteryForm
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          setStep={setStep}
          validateForm={validateForm}
        />
      )}
      {step === 'preview' && (
        <CreateLotteryPreview
          formData={formData}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          setStep={setStep}
        />
      )}
      {step === 'success' && (
        <CreateLotterySuccess
          formData={formData}
          showConfetti={showConfetti}
          handleConfettiComplete={handleConfettiComplete}
          lotteryId={lotteryId?.toString()}
        />
      )}
    </div>
  );
}
