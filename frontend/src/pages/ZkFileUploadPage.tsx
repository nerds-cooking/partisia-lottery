import { usePartisia } from '@/components/providers/partisia/usePartisia';
import { useSettings } from '@/components/providers/setting/useSettings';
import { addFile } from '@/lib/ZKFileShareApi';
import {
  BlockchainAddress,
  BlockchainTransactionClient
} from '@partisiablockchain/blockchain-api-transaction-client';
import { Client, RealZkClient } from '@partisiablockchain/zk-client';
import { useState } from 'react';

const UploadFilePage = () => {
  const { sdk } = usePartisia();
  const { settings } = useSettings();

  const [status, setStatus] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setStatus('🔄 Submitting');
      setErrorDetails(null);

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
          getAddress: () => currentAccount!.address as BlockchainAddress,
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

      const createGameSecretInputBuilder = addFile(8);
      const secretInput = createGameSecretInputBuilder.secretInput(
        [1, 0, 0, 0] // Example file data
        // Buffer.from('1') as any
      );
      const transaction = await zkClient.buildOnChainInputTransaction(
        currentAccount!.address,
        secretInput.secretInput,
        secretInput.publicRpc
      );

      const txn = await transactionClient.signAndSend(transaction, 500_000);

      await transactionClient.waitForInclusionInBlock(txn);

      setStatus(
        `Completed! Transaction: ${txn.signedTransaction.identifier()}`
      );
    } catch (error: any) {
      console.error('Error details:', error);
      setStatus(`❌ Error occurred`);
      setErrorDetails(error.message || String(error));
    }
  };

  const handleReconstruct = async () => {
    setStatus('🔄 Reconstructing secret');
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

    const pk = await sdk?.requestKey();
    console.log('Public key:', pk);

    setStatus('🔄 ');
    const test = sdk!
      .signMessage({
        payload: hash.toString('hex'),
        payloadType: 'utf8',
        dontBroadcast: true
      })
      .then((res) => Buffer.from(res.signature, 'hex'));

    const zkClient = RealZkClient.create(contractAddress, client);
    const zkContractNodes = await zkClient.getZkContractNodes();
    // const secretShares: BinarySecretShares =
    //   await zkContractNodes.fetchSharesFromNodes(
    //     {
    //       sign: (hash: Buffer) => {
    //         return sdk!
    //           .signMessage({
    //             payload: hash.toString('hex'),
    //             payloadType: 'utf8',
    //             dontBroadcast: true
    //           })
    //           .then((res) => Buffer.from(res.signature, 'hex'));
    //       }
    //     },
    //     1
    //   );

    const output = secretShares.reconstructSecret();

    console.log('Reconstructed secret:', output);
    // Get shares from all ZK engines
    // const secretShares = await zkClient.fetchSecretVariable(
    //   {
    //     sign(hash) {
    //       return sdk!.signMessage({
    //         payload: hash.toString('hex'),
    //         payloadType: 'hex',
    //         dontBroadcast: true
    //       });
    //     }
    //   } as any,
    //   0 // Assuming variableId is 0 for the secret file
    // );

    setStatus('🔄 Reconstructing secret from shares');
    console.log('Fetched secret shares:', secretShares);

    // // Reconstruct the secret from the shares
    // const reconstructedSecret = secretShares.reconstructSecret();

    // // Convert the binary data to the original format (32-bit signed integer)
    // const reconstructedInt = new BitInput(
    //   reconstructedSecret.data
    // ).readSignedNumber(32);
  };

  return (
    <div className='p-6 max-w-xl mx-auto bg-white/5 backdrop-blur-md rounded-lg border border-white/10'>
      <h1 className='text-xl font-bold mb-4 text-white'>
        Submit a secret file
      </h1>
      <div className='mb-6'>
        <div className='flex items-center gap-4'>
          <label className='cursor-pointer bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-md'>
            <button onClick={handleSubmit}>Submit</button>
          </label>
        </div>
      </div>

      <div className='mb-6'>
        <div className='flex items-center gap-4'>
          <label className='cursor-pointer bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-md'>
            <button onClick={handleReconstruct}>Reconstruct</button>
          </label>
        </div>
      </div>

      {status && (
        <div className='mt-6 p-4 bg-black/20 rounded-md border border-white/10'>
          <p className='text-white'>{status}</p>
          {errorDetails && (
            <p className='text-red-400 mt-2 text-sm overflow-auto whitespace-pre-wrap'>
              {errorDetails}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadFilePage;
