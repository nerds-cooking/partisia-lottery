import CreateLotteryForm from '@/components/create-lottery/CreateLotteryForm';
import CreateLotteryPreview from '@/components/create-lottery/CreateLotteryPreview';
import CreateLotterySuccess from '@/components/create-lottery/CreateLotterySuccess';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePartisia } from '@/components/providers/partisia/usePartisia';
import { useSettings } from '@/components/providers/setting/useSettings';
import { useGetMyAccountKey } from '@/hooks/useGetMyAccountKey';
import axiosInstance from '@/lib/axios';
import { LotteryApi } from '@/lib/LotteryApi';
import { BN } from '@partisiablockchain/abi-client';
import { BlockchainTransactionClient } from '@partisiablockchain/blockchain-api-transaction-client';
import { Client, RealZkClient } from '@partisiablockchain/zk-client';
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
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');
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
    name: 'Test Lottery',
    description: 'This is a test lottery description.',
    prizePool: '5',
    ticketPrice: '1',
    duration: '24'
  });
  const [lotteryId, setLotteryId] = useState<BN | undefined>(undefined);

  const { accountKey: userAccountKey, loading: isAccountKeyLoading } =
    useGetMyAccountKey();

  if (isAccountKeyLoading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <LoadingSpinner />
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
      {step === 'form' && (
        <CreateLotteryForm
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          setStep={setStep}
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
