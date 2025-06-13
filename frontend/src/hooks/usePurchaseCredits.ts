import { Settings } from '@/components/providers/setting/setting-provider';
import { LotteryApi } from '@/lib/LotteryApi';
import { TestTokenApi } from '@/lib/TestTokenApi';
import { TestTokenGenerated } from '@/lib/TestTokenGenerated';
import {
  BlockchainAddress,
  BlockchainStateClientImpl,
  BN
} from '@partisiablockchain/abi-client';
import { BlockchainTransactionClient } from '@partisiablockchain/blockchain-api-transaction-client';
import { Client, RealZkClient } from '@partisiablockchain/zk-client';
import PartisiaSdk from 'partisia-blockchain-applications-sdk';
import { useCallback } from 'react';

export function usePurchaseCredits() {
  return useCallback(
    async ({
      sdk,
      settings,
      purchaseCreditsAmount,
      setStatus,
      setErrorDetails
    }: {
      sdk: PartisiaSdk | null;
      settings: Settings | null;
      purchaseCreditsAmount: number;
      setStatus: (msg: string) => void;
      setErrorDetails: (msg: string | null) => void;
    }) => {
      try {
        setStatus('🔄 Checking approval');
        setErrorDetails(null);
        const currentAccount = sdk?.connection.account;
        const tokenContractAddress = settings?.find(
          (s) => s.name === 'tokenContractAddress'
        )?.value;
        if (!tokenContractAddress) return;
        const lotteryContractAddress = settings?.find(
          (s) => s.name === 'contractAddress'
        )?.value;
        if (!lotteryContractAddress) return;
        const partisiaClientUrl = settings?.find(
          (s) => s.name === 'partisiaClientUrl'
        )?.value;
        if (!partisiaClientUrl) return;
        const stateClient = BlockchainStateClientImpl.create(partisiaClientUrl);
        const testTokenClient = new TestTokenGenerated(
          stateClient,
          BlockchainAddress.fromString(tokenContractAddress)
        );
        const tokenState = await testTokenClient.getState();
        setStatus(`Checking allowance for ${purchaseCreditsAmount} credits...`);
        const allowance = await tokenState.allowed.get({
          owner: BlockchainAddress.fromString(currentAccount!.address),
          spender: BlockchainAddress.fromString(lotteryContractAddress)
        });
        setStatus(
          `Current allowance: ${allowance ? allowance.toString() : '0'}`
        );
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
        if (!allowance || allowance.lt(new BN(purchaseCreditsAmount))) {
          setStatus('🔄 Approving token transfer');
          const testTokenApi = new TestTokenApi(
            transactionClient,
            RealZkClient.create(tokenContractAddress, client),
            BlockchainAddress.fromString(currentAccount!.address),
            tokenContractAddress
          );
          const approveAmount = new BN(purchaseCreditsAmount);
          const txn = await testTokenApi.approve(
            BlockchainAddress.fromString(lotteryContractAddress),
            approveAmount
          );
          setStatus(
            `Approved! Transaction hash: ${txn.signedTransaction.identifier()}`
          );
        }
        setStatus('🔄 Purchasing credits');
        const lotteryApi = new LotteryApi(
          transactionClient,
          RealZkClient.create(lotteryContractAddress, client),
          currentAccount!.address,
          lotteryContractAddress
        );
        const purchaseTxn = await lotteryApi.purchaseCredits(
          new BN(purchaseCreditsAmount)
        );
        setStatus(
          `Purchase completed! Transaction hash: ${purchaseTxn.signedTransaction.identifier()}`
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
