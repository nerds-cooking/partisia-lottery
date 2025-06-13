import { BlockchainAddress, BN } from '@partisiablockchain/abi-client';
import { BlockchainTransactionClient } from '@partisiablockchain/blockchain-api-transaction-client';
import { RealZkClient } from '@partisiablockchain/zk-client';
import { approve } from './TestTokenGenerated';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TestTokenBasicState {}

export class TestTokenApi {
  private readonly transactionClient: BlockchainTransactionClient | undefined;
  private readonly zkClient: RealZkClient;
  private readonly sender: BlockchainAddress;
  private readonly contractAddress: string;

  constructor(
    transactionClient: BlockchainTransactionClient | undefined,
    zkClient: RealZkClient,
    sender: BlockchainAddress,
    contractAddress: string
  ) {
    this.transactionClient = transactionClient;
    this.zkClient = zkClient;
    this.sender = sender;
    this.contractAddress = contractAddress;
  }

  readonly approve = async (spender: BlockchainAddress, amount: BN) => {
    if (this.transactionClient === undefined) {
      throw new Error('No account logged in');
    }

    const spenderAddress: BlockchainAddress =
      typeof spender === 'string'
        ? BlockchainAddress.fromString(spender)
        : spender;

    const approval = approve(spenderAddress, amount);

    console.log('Approval RPC:', approval);
    if (!approval) {
      throw new Error('Failed to create approval RPC');
    }

    const rawTxn = {
      address: this.contractAddress,
      rpc: approval
    };

    const txn = await this.transactionClient.signAndSend(rawTxn, 500_000);

    await this.transactionClient.waitForInclusionInBlock(txn);

    return txn;
  };
}
