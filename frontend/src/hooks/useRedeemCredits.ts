import { Settings } from '@/components/providers/setting/setting-provider';
import { LotteryApi } from '@/lib/LotteryApi';
import { BN } from '@partisiablockchain/abi-client';
import { BlockchainTransactionClient } from '@partisiablockchain/blockchain-api-transaction-client';
import { Client, RealZkClient } from '@partisiablockchain/zk-client';
import PartisiaSdk from 'partisia-blockchain-applications-sdk';
import { useCallback } from 'react';

export function useRedeemCredits() {
  return useCallback(
    async ({
      sdk,
      settings,
      redeemCreditsAmount,
      setStatus,
      setErrorDetails
    }: {
      sdk: PartisiaSdk | null;
      settings: Settings | null;
      redeemCreditsAmount: number;
      setStatus: (msg: string) => void;
      setErrorDetails: (msg: string | null) => void;
    }) => {
      try {
        setStatus('🔄 Redeeming credits');
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
        const redeemTxn = await lotteryApi.redeemCredits(
          new BN(redeemCreditsAmount)
        );
        setStatus(
          `Redeem completed! Transaction hash: ${redeemTxn.signedTransaction.identifier()}`
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
