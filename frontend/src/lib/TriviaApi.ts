import {
  BlockchainAddress,
  BlockchainTransactionClient,
  ChainControllerApi,
  Configuration,
  Transaction,
} from "@partisiablockchain/blockchain-api-transaction-client";

import { RealZkClient } from "@partisiablockchain/zk-client";
import {
  createGame,
  deserializeState,
  finishGame,
  GameInitParams,
  submitAnswers,
} from "./TriviaApiGenerated";

export interface TriviaBasicState {}

export class TriviaApi {
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

  readonly getState = async (
    clientHost: string,
    contractAddress: string
  ): Promise<TriviaBasicState> => {
    // use `/shards/{shardId}/blockchain/contracts/{address}?stateOutput=binary`
    // to get the state bytes for a ZK contract, normal state fetching will not work

    const client = new ChainControllerApi(
      new Configuration({
        basePath: clientHost,
      })
    );

    const contract = await client.getContract({
      address: contractAddress,
    });

    const shardId = contract.shardId;

    const endpoint = `shards/${shardId}/blockchain/contracts/${contractAddress}`;

    const response = await fetch(
      `https://node1.testnet.partisiablockchain.com/${endpoint}`
    );

    console.log("response", response);

    console.log("contract", contract);

    const s = await response.json();

    console.log("fetched", s.serializedContract);
    console.log("normal", contract.serializedContract);

    const stateBuffer = Buffer.from(
      s.serializedContract.openState.openState.data,
      "base64"
    );
    return deserializeState(stateBuffer);

    // Reads the state of the contract
    // if (contract.serializedContract != undefined) {
    // } else throw new Error("Could not get the contract state.");
  };

  /**
   * Creates a new game on the blockchain.
   * @param params - The parameters for the game.
   * @param answers - The answers to the questions in the game.
   */
  readonly createGame = async (params: GameInitParams, answers: number[]) => {
    if (this.transactionClient === undefined) {
      throw new Error("No account logged in");
    }

    const createGameSecretInputBuilder = createGame(params);
    const secretInput = createGameSecretInputBuilder.secretInput(answers);
    const transaction = await this.zkClient.buildOnChainInputTransaction(
      this.sender,
      secretInput.secretInput,
      secretInput.publicRpc
    );

    const txn = await this.transactionClient.signAndSend(transaction, 500_000);

    await this.transactionClient.waitForInclusionInBlock(txn);

    return txn;
  };

  readonly submitAnswers = async (gameId: number, answers: number[]) => {
    if (this.transactionClient === undefined) {
      throw new Error("No account logged in");
    }

    const submitAnswersSecretInputBuilder = submitAnswers(gameId);
    const secretInput = submitAnswersSecretInputBuilder.secretInput(answers);
    const transaction = await this.zkClient.buildOnChainInputTransaction(
      this.sender,
      secretInput.secretInput,
      secretInput.publicRpc
    );

    return this.transactionClient.signAndSend(transaction, 500_000);
  };

  readonly finishGame = async (gameId: number) => {
    if (this.transactionClient === undefined) {
      throw new Error("No account logged in");
    }

    const finishGameTxn = finishGame(gameId);
    const txn: Transaction = {
      address: this.contractAddress,
      rpc: finishGameTxn,
    };

    return this.transactionClient.signAndSend(txn, 100_000);
  };
}
