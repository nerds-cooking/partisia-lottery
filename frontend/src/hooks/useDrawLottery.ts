import { Settings } from '@/components/providers/setting/setting-provider';
import { LotteryApi } from '@/lib/LotteryApi';
import { BN } from '@partisiablockchain/abi-client';
import { BlockchainTransactionClient } from '@partisiablockchain/blockchain-api-transaction-client';
import { Client, RealZkClient } from '@partisiablockchain/zk-client';
import PartisiaSdk from 'partisia-blockchain-applications-sdk';
import { useCallback } from 'react';

export function useDrawLottery() {
  return useCallback(
    async ({
      sdk,
      settings,
      lotteryId
    }: {
      sdk: PartisiaSdk | null;
      settings: Settings | null;
      lotteryId: BN;
    }) => {
      try {
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

        await lotteryApi.drawLottery(new BN(lotteryId));
      } catch (error: unknown) {
        console.error('Error details:', error);
      }
    },
    []
  );
}
