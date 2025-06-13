import { Settings } from '@/components/providers/setting/setting-provider';
import { LotteryApi } from '@/lib/LotteryApi';
import { BN } from '@partisiablockchain/abi-client';
import { BlockchainTransactionClient } from '@partisiablockchain/blockchain-api-transaction-client';
import { Client, RealZkClient } from '@partisiablockchain/zk-client';
import PartisiaSdk from 'partisia-blockchain-applications-sdk';
import { useCallback } from 'react';

export function useCreateAccount() {
  return useCallback(
    async ({
      sdk,
      settings,
      accountNumber,
      setStatus,
      setErrorDetails
    }: {
      sdk: PartisiaSdk | null;
      settings: Settings | null;
      accountNumber: number;
      setStatus: (msg: string) => void;
      setErrorDetails: (msg: string | null) => void;
    }) => {
      try {
        setErrorDetails(null);
        const currentAccount = sdk?.connection.account;

        const lotteryContractAddress = settings?.find(
          (s) => s.name === 'contractAddress'
        )?.value;

        if (!lotteryContractAddress) return;
        const partisiaClientUrl = settings?.find(
          (s) => s.name === 'partisiaClientUrl'
        )?.value;

        if (!partisiaClientUrl) return;

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

        const lotteryApi = new LotteryApi(
          transactionClient,
          RealZkClient.create(lotteryContractAddress, client),
          currentAccount!.address,
          lotteryContractAddress
        );
        const createAccountTxn = await lotteryApi.createAccount(
          new BN(accountNumber)
        );
        setStatus(
          `Purchase completed! Transaction hash: ${createAccountTxn.signedTransaction.identifier()}`
        );
      } catch (error: unknown) {
        setStatus('❌ Error occurred');
        setErrorDetails(error instanceof Error ? error.message : String(error));
        console.error('Error details:', error);
      }
    },
    []
  );
}
