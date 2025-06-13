import {
  BlockchainAddress,
  BlockchainTransactionClient,
  SentTransaction,
  Transaction
} from '@partisiablockchain/blockchain-api-transaction-client';

import { BN } from '@partisiablockchain/abi-client';
import { RealZkClient } from '@partisiablockchain/zk-client';
import {
  claim,
  createAccount,
  createLottery,
  drawWinner,
  purchaseCredits,
  purchaseTickets,
  redeemCredits
} from './LotteryApiGenerated';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LotteryBasicState {}

export class LotteryApi {
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

  /**
   * Create a new account on the blockchain.
   * This function builds a transaction to create an account using the provided key.
   * It requires the transaction client to be initialized and the user to be logged in.
   *
   * @throws Error if no account is logged in or if the transaction fails.
   * @param key
   * @returns
   */
  readonly createAccount = async (accountKey: BN) => {
    if (this.transactionClient === undefined) {
      throw new Error('No account logged in');
    }

    const createAccountSecretInputBuilder = createAccount(accountKey);
    const secretInput = createAccountSecretInputBuilder.secretInput({
      accountKey
    });
    const transaction = await this.zkClient.buildOnChainInputTransaction(
      this.sender,
      secretInput.secretInput,
      secretInput.publicRpc
    );

    const txn = await this.transactionClient.signAndSend(transaction, 500_000);

    await this.transactionClient.waitForInclusionInBlock(txn);

    return txn;
  };

  public async purchaseCredits(amount: BN): Promise<SentTransaction> {
    if (this.transactionClient === undefined) {
      throw new Error('No account logged in');
    }

    const purchaseCreditsTxn = purchaseCredits(amount);
    const transaction: Transaction = {
      address: this.contractAddress,
      rpc: purchaseCreditsTxn
    };

    const txn = await this.transactionClient.signAndSend(transaction, 500_000);

    await this.transactionClient.waitForInclusionInBlock(txn);

    return txn;
  }

  public async redeemCredits(amount: BN): Promise<SentTransaction> {
    if (this.transactionClient === undefined) {
      throw new Error('No account logged in');
    }

    const redeemCreditsTxn = redeemCredits(amount);
    const transaction: Transaction = {
      address: this.contractAddress,
      rpc: redeemCreditsTxn
    };

    const txn = await this.transactionClient.signAndSend(transaction, 500_000);

    await this.transactionClient.waitForInclusionInBlock(txn);

    return txn;
  }

  public async createLottery(
    lotteryId: BN,
    deadline: BN,
    entryCost: BN,
    prizePool: BN,
    creatorAccountKey: BN,
    randomSeed: BN
  ): Promise<SentTransaction> {
    if (this.transactionClient === undefined) {
      throw new Error('No account logged in');
    }

    const createLotteryBuilder = createLottery(
      lotteryId,
      deadline,
      entryCost,
      prizePool
    );
    const secretInput = createLotteryBuilder.secretInput({
      lotteryAccountKey: lotteryId,
      creatorAccountKey,
      randomSeed
    });
    const transaction = await this.zkClient.buildOnChainInputTransaction(
      this.sender,
      secretInput.secretInput,
      secretInput.publicRpc
    );

    const txn = await this.transactionClient.signAndSend(transaction, 500_000);

    await this.transactionClient.waitForInclusionInBlock(txn);

    return txn;
  }

  public async purchaseTickets(
    lotteryId: BN,
    tickets: BN,
    purchaserAccountKey: BN,
    lotteryAccountKey: BN,
    entropy: BN
  ): Promise<SentTransaction> {
    if (this.transactionClient === undefined) {
      throw new Error('No account logged in');
    }

    const purchaseTicketsBuilder = purchaseTickets(lotteryId);
    const secretInput = purchaseTicketsBuilder.secretInput({
      lotteryAccountKey,
      purchaserAccountKey,
      tickets,
      entropy
    });
    const transaction = await this.zkClient.buildOnChainInputTransaction(
      this.sender,
      secretInput.secretInput,
      secretInput.publicRpc
    );

    const txn = await this.transactionClient.signAndSend(transaction, 500_000);

    await this.transactionClient.waitForInclusionInBlock(txn);

    return txn;
  }

  public async drawLottery(lotteryId: BN): Promise<SentTransaction> {
    if (this.transactionClient === undefined) {
      throw new Error('No account logged in');
    }

    const drawLotteryTxn = drawWinner(lotteryId);
    const transaction: Transaction = {
      address: this.contractAddress,
      rpc: drawLotteryTxn
    };

    const txn = await this.transactionClient.signAndSend(transaction, 500_000);

    await this.transactionClient.waitForInclusionInBlock(txn);

    return txn;
  }

  public async claim(lotteryId: BN): Promise<SentTransaction> {
    if (this.transactionClient === undefined) {
      throw new Error('No account logged in');
    }

    const claimPrizeTxn = claim(lotteryId);
    const transaction: Transaction = {
      address: this.contractAddress,
      rpc: claimPrizeTxn
    };

    const txn = await this.transactionClient.signAndSend(transaction, 500_000);

    await this.transactionClient.waitForInclusionInBlock(txn);

    return txn;
  }
}
