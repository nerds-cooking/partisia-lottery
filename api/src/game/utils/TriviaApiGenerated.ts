// This file is auto-generated from an abi-file using AbiCodegen.
/* eslint-disable */
// @ts-nocheck
// noinspection ES6UnusedImports
import {
  AbiBitOutput,
  AbiByteInput,
  AbiByteOutput,
  AbiInput,
  AbiOutput,
  AvlTreeMap,
  BlockchainAddress,
  BlockchainStateClient,
  BN,
  SecretInputBuilder,
  StateWithClient,
} from '@partisiablockchain/abi-client';

type Option<K> = K | undefined;
export class TriviaApiGenerated {
  private readonly _client: BlockchainStateClient | undefined;
  private readonly _address: BlockchainAddress | undefined;

  public constructor(
    client: BlockchainStateClient | undefined,
    address: BlockchainAddress | undefined,
  ) {
    this._address = address;
    this._client = client;
  }
  public deserializeContractState(_input: AbiInput): ContractState {
    const gameIds: AvlTreeSetU32 = this.deserializeAvlTreeSetU32(_input);
    const games_vecLength = _input.readI32();
    const games: GameState[] = [];
    for (let games_i = 0; games_i < games_vecLength; games_i++) {
      const games_elem: GameState = this.deserializeGameState(_input);
      games.push(games_elem);
    }
    return { gameIds, games };
  }
  public deserializeAvlTreeSetU32(_input: AbiInput): AvlTreeSetU32 {
    const innerMap_treeId = _input.readI32();
    const innerMap: AvlTreeMap<number, Unit> = new AvlTreeMap(
      innerMap_treeId,
      this._client,
      this._address,
      (innerMap_key) =>
        AbiByteOutput.serializeLittleEndian((innerMap_out) => {
          innerMap_out.writeU32(innerMap_key);
        }),
      (innerMap_bytes) => {
        const innerMap_input = AbiByteInput.createLittleEndian(innerMap_bytes);
        const innerMap_key: number = innerMap_input.readU32();
        return innerMap_key;
      },
      (innerMap_bytes) => {
        const innerMap_input = AbiByteInput.createLittleEndian(innerMap_bytes);
        const innerMap_value: Unit = this.deserializeUnit(innerMap_input);
        return innerMap_value;
      },
    );
    return { innerMap };
  }
  public deserializeUnit(_input: AbiInput): Unit {
    return {};
  }
  public deserializeGameState(_input: AbiInput): GameState {
    const gameId: number = _input.readU32();
    const creator: BlockchainAddress = _input.readAddress();
    const gameStatus: GameStatus = this.deserializeGameStatus(_input);
    const gameDeadline: BN = _input.readI64();
    const questionCount: number = _input.readU8();
    const players: AvlTreeSetAddress =
      this.deserializeAvlTreeSetAddress(_input);
    let gameDataSvar: Option<SecretVarId> = undefined;
    const gameDataSvar_isSome = _input.readBoolean();
    if (gameDataSvar_isSome) {
      const gameDataSvar_option: SecretVarId =
        this.deserializeSecretVarId(_input);
      gameDataSvar = gameDataSvar_option;
    }
    const entriesSvars_vecLength = _input.readI32();
    const entriesSvars: SecretVarId[] = [];
    for (
      let entriesSvars_i = 0;
      entriesSvars_i < entriesSvars_vecLength;
      entriesSvars_i++
    ) {
      const entriesSvars_elem: SecretVarId =
        this.deserializeSecretVarId(_input);
      entriesSvars.push(entriesSvars_elem);
    }
    const resultsSvars_vecLength = _input.readI32();
    const resultsSvars: SecretVarId[] = [];
    for (
      let resultsSvars_i = 0;
      resultsSvars_i < resultsSvars_vecLength;
      resultsSvars_i++
    ) {
      const resultsSvars_elem: SecretVarId =
        this.deserializeSecretVarId(_input);
      resultsSvars.push(resultsSvars_elem);
    }
    const leaderboard_vecLength = _input.readI32();
    const leaderboard: LeaderboardPosition[] = [];
    for (
      let leaderboard_i = 0;
      leaderboard_i < leaderboard_vecLength;
      leaderboard_i++
    ) {
      const leaderboard_elem: LeaderboardPosition =
        this.deserializeLeaderboardPosition(_input);
      leaderboard.push(leaderboard_elem);
    }
    return {
      gameId,
      creator,
      gameStatus,
      gameDeadline,
      questionCount,
      players,
      gameDataSvar,
      entriesSvars,
      resultsSvars,
      leaderboard,
    };
  }
  public deserializeGameStatus(_input: AbiInput): GameStatus {
    const discriminant = _input.readU8();
    if (discriminant === 1) {
      return this.deserializeGameStatusPending(_input);
    } else if (discriminant === 2) {
      return this.deserializeGameStatusInProgress(_input);
    } else if (discriminant === 3) {
      return this.deserializeGameStatusComplete(_input);
    } else if (discriminant === 4) {
      return this.deserializeGameStatusPublished(_input);
    }
    throw new Error('Unknown discriminant: ' + discriminant);
  }
  public deserializeGameStatusPending(_input: AbiInput): GameStatusPending {
    return { discriminant: GameStatusD.Pending };
  }
  public deserializeGameStatusInProgress(
    _input: AbiInput,
  ): GameStatusInProgress {
    return { discriminant: GameStatusD.InProgress };
  }
  public deserializeGameStatusComplete(_input: AbiInput): GameStatusComplete {
    return { discriminant: GameStatusD.Complete };
  }
  public deserializeGameStatusPublished(_input: AbiInput): GameStatusPublished {
    return { discriminant: GameStatusD.Published };
  }
  public deserializeAvlTreeSetAddress(_input: AbiInput): AvlTreeSetAddress {
    const innerMap_treeId = _input.readI32();
    const innerMap: AvlTreeMap<BlockchainAddress, Unit> = new AvlTreeMap(
      innerMap_treeId,
      this._client,
      this._address,
      (innerMap_key) =>
        AbiByteOutput.serializeLittleEndian((innerMap_out) => {
          innerMap_out.writeAddress(innerMap_key);
        }),
      (innerMap_bytes) => {
        const innerMap_input = AbiByteInput.createLittleEndian(innerMap_bytes);
        const innerMap_key: BlockchainAddress = innerMap_input.readAddress();
        return innerMap_key;
      },
      (innerMap_bytes) => {
        const innerMap_input = AbiByteInput.createLittleEndian(innerMap_bytes);
        const innerMap_value: Unit = this.deserializeUnit(innerMap_input);
        return innerMap_value;
      },
    );
    return { innerMap };
  }
  public deserializeSecretVarId(_input: AbiInput): SecretVarId {
    const rawId: number = _input.readU32();
    return { rawId };
  }
  public deserializeLeaderboardPosition(_input: AbiInput): LeaderboardPosition {
    const gameId: number = _input.readU32();
    const player: BlockchainAddress = _input.readAddress();
    const score: number = _input.readI8();
    return { gameId, player, score };
  }
  public async getState(): Promise<ContractState> {
    const bytes = await this._client?.getContractStateBinary(this._address!);
    if (bytes === undefined) {
      throw new Error('Unable to get state bytes');
    }
    const input = AbiByteInput.createLittleEndian(bytes);
    return this.deserializeContractState(input);
  }
}
export interface ContractState {
  gameIds: AvlTreeSetU32;
  games: GameState[];
}

export interface AvlTreeSetU32 {
  innerMap: AvlTreeMap<number, Unit>;
}

export interface Unit {}

export interface GameState {
  gameId: number;
  creator: BlockchainAddress;
  gameStatus: GameStatus;
  gameDeadline: BN;
  questionCount: number;
  players: AvlTreeSetAddress;
  gameDataSvar: Option<SecretVarId>;
  entriesSvars: SecretVarId[];
  resultsSvars: SecretVarId[];
  leaderboard: LeaderboardPosition[];
}

export enum GameStatusD {
  Pending = 1,
  InProgress = 2,
  Complete = 3,
  Published = 4,
}
export type GameStatus =
  | GameStatusPending
  | GameStatusInProgress
  | GameStatusComplete
  | GameStatusPublished;

export interface GameStatusPending {
  discriminant: GameStatusD.Pending;
}

export interface GameStatusInProgress {
  discriminant: GameStatusD.InProgress;
}

export interface GameStatusComplete {
  discriminant: GameStatusD.Complete;
}

export interface GameStatusPublished {
  discriminant: GameStatusD.Published;
}

export interface AvlTreeSetAddress {
  innerMap: AvlTreeMap<BlockchainAddress, Unit>;
}

export interface SecretVarId {
  rawId: number;
}

export interface LeaderboardPosition {
  gameId: number;
  player: BlockchainAddress;
  score: number;
}

export interface GameInitParams {
  gameId: number;
  questionCount: number;
  gameDeadline: BN;
}
function serializeGameInitParams(
  _out: AbiOutput,
  _value: GameInitParams,
): void {
  const { gameId, questionCount, gameDeadline } = _value;
  _out.writeU32(gameId);
  _out.writeU8(questionCount);
  _out.writeI64(gameDeadline);
}

export function initialize(): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from('ffffffff0f', 'hex'));
  });
}

export function finishGame(gameId: number): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from('10', 'hex'));
    _out.writeU32(gameId);
  });
}

export function createGame(
  params: GameInitParams,
): SecretInputBuilder<number[]> {
  const _publicRpc: Buffer = AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from('40', 'hex'));
    serializeGameInitParams(_out, params);
  });
  const _secretInput = (secret_input_lambda: number[]): CompactBitArray =>
    AbiBitOutput.serialize((_out) => {
      if (secret_input_lambda.length !== 20) {
        throw new Error(
          'Length of secret_input_lambda does not match expected 20',
        );
      }
      for (const secret_input_lambda_arr of secret_input_lambda) {
        _out.writeI8(secret_input_lambda_arr);
      }
    });
  return new SecretInputBuilder(_publicRpc, _secretInput);
}

export function submitAnswers(gameId: number): SecretInputBuilder<number[]> {
  const _publicRpc: Buffer = AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from('41', 'hex'));
    _out.writeU32(gameId);
  });
  const _secretInput = (secret_input_lambda: number[]): CompactBitArray =>
    AbiBitOutput.serialize((_out) => {
      if (secret_input_lambda.length !== 20) {
        throw new Error(
          'Length of secret_input_lambda does not match expected 20',
        );
      }
      for (const secret_input_lambda_arr of secret_input_lambda) {
        _out.writeI8(secret_input_lambda_arr);
      }
    });
  return new SecretInputBuilde(_publicRpc, _secretInput);
}

export function deserializeState(state: StateWithClient): ContractState;
export function deserializeState(bytes: Buffer): ContractState;
export function deserializeState(
  bytes: Buffer,
  client: BlockchainStateClient,
  address: BlockchainAddress,
): ContractState;
export function deserializeState(
  state: Buffer | StateWithClient,
  client?: BlockchainStateClient,
  address?: BlockchainAddress,
): ContractState {
  if (Buffer.isBuffer(state)) {
    const input = AbiByteInput.createLittleEndian(state);
    return new TriviaApiGenerated(client, address).deserializeContractState(
      input,
    );
  } else {
    const input = AbiByteInput.createLittleEndian(state.bytes);
    return new TriviaApiGenerated(
      state.client,
      state.address,
    ).deserializeContractState(input);
  }
}
