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
  StateWithClient
} from "@partisiablockchain/abi-client";

type Option<K> = K | undefined;
export class LotteryApiGenerated {
  private readonly _client: BlockchainStateClient | undefined;
  private readonly _address: BlockchainAddress | undefined;
  
  public constructor(
    client: BlockchainStateClient | undefined,
    address: BlockchainAddress | undefined
  ) {
    this._address = address;
    this._client = client;
  }
  public deserializeContractState(_input: AbiInput): ContractState {
    const token: BlockchainAddress = _input.readAddress();
    const api: BlockchainAddress = _input.readAddress();
    const userAccounts_treeId = _input.readI32();
    const userAccounts: AvlTreeMap<BlockchainAddress, SecretVarId> = new AvlTreeMap(
      userAccounts_treeId,
      this._client,
      this._address,
      (userAccounts_key) => AbiByteOutput.serializeLittleEndian((userAccounts_out) => {
        userAccounts_out.writeAddress(userAccounts_key);
      }),
      (userAccounts_bytes) => {
        const userAccounts_input = AbiByteInput.createLittleEndian(userAccounts_bytes);
        const userAccounts_key: BlockchainAddress = userAccounts_input.readAddress();
        return userAccounts_key;
      },
      (userAccounts_bytes) => {
        const userAccounts_input = AbiByteInput.createLittleEndian(userAccounts_bytes);
        const userAccounts_value: SecretVarId = this.deserializeSecretVarId(userAccounts_input);
        return userAccounts_value;
      }
    );
    const uaAccountKeyMap_treeId = _input.readI32();
    const uaAccountKeyMap: AvlTreeMap<BN, BlockchainAddress> = new AvlTreeMap(
      uaAccountKeyMap_treeId,
      this._client,
      this._address,
      (uaAccountKeyMap_key) => AbiByteOutput.serializeLittleEndian((uaAccountKeyMap_out) => {
        uaAccountKeyMap_out.writeUnsignedBigInteger(uaAccountKeyMap_key, 16);
      }),
      (uaAccountKeyMap_bytes) => {
        const uaAccountKeyMap_input = AbiByteInput.createLittleEndian(uaAccountKeyMap_bytes);
        const uaAccountKeyMap_key: BN = uaAccountKeyMap_input.readUnsignedBigInteger(16);
        return uaAccountKeyMap_key;
      },
      (uaAccountKeyMap_bytes) => {
        const uaAccountKeyMap_input = AbiByteInput.createLittleEndian(uaAccountKeyMap_bytes);
        const uaAccountKeyMap_value: BlockchainAddress = uaAccountKeyMap_input.readAddress();
        return uaAccountKeyMap_value;
      }
    );
    const lotteryAccounts_treeId = _input.readI32();
    const lotteryAccounts: AvlTreeMap<BN, SecretVarId> = new AvlTreeMap(
      lotteryAccounts_treeId,
      this._client,
      this._address,
      (lotteryAccounts_key) => AbiByteOutput.serializeLittleEndian((lotteryAccounts_out) => {
        lotteryAccounts_out.writeUnsignedBigInteger(lotteryAccounts_key, 16);
      }),
      (lotteryAccounts_bytes) => {
        const lotteryAccounts_input = AbiByteInput.createLittleEndian(lotteryAccounts_bytes);
        const lotteryAccounts_key: BN = lotteryAccounts_input.readUnsignedBigInteger(16);
        return lotteryAccounts_key;
      },
      (lotteryAccounts_bytes) => {
        const lotteryAccounts_input = AbiByteInput.createLittleEndian(lotteryAccounts_bytes);
        const lotteryAccounts_value: SecretVarId = this.deserializeSecretVarId(lotteryAccounts_input);
        return lotteryAccounts_value;
      }
    );
    const lotteries_treeId = _input.readI32();
    const lotteries: AvlTreeMap<BN, LotteryState> = new AvlTreeMap(
      lotteries_treeId,
      this._client,
      this._address,
      (lotteries_key) => AbiByteOutput.serializeLittleEndian((lotteries_out) => {
        lotteries_out.writeUnsignedBigInteger(lotteries_key, 16);
      }),
      (lotteries_bytes) => {
        const lotteries_input = AbiByteInput.createLittleEndian(lotteries_bytes);
        const lotteries_key: BN = lotteries_input.readUnsignedBigInteger(16);
        return lotteries_key;
      },
      (lotteries_bytes) => {
        const lotteries_input = AbiByteInput.createLittleEndian(lotteries_bytes);
        const lotteries_value: LotteryState = this.deserializeLotteryState(lotteries_input);
        return lotteries_value;
      }
    );
    const workQueue_vecLength = _input.readI32();
    const workQueue: WorkListItem[] = [];
    for (let workQueue_i = 0; workQueue_i < workQueue_vecLength; workQueue_i++) {
      const workQueue_elem: WorkListItem = this.deserializeWorkListItem(_input);
      workQueue.push(workQueue_elem);
    }
    const redundantVariables_vecLength = _input.readI32();
    const redundantVariables: SecretVarId[] = [];
    for (let redundantVariables_i = 0; redundantVariables_i < redundantVariables_vecLength; redundantVariables_i++) {
      const redundantVariables_elem: SecretVarId = this.deserializeSecretVarId(_input);
      redundantVariables.push(redundantVariables_elem);
    }
    return { token, api, userAccounts, uaAccountKeyMap, lotteryAccounts, lotteries, workQueue, redundantVariables };
  }
  public deserializeSecretVarId(_input: AbiInput): SecretVarId {
    const rawId: number = _input.readU32();
    return { rawId };
  }
  public deserializeLotteryState(_input: AbiInput): LotteryState {
    const lotteryId: BN = _input.readUnsignedBigInteger(16);
    const creator: BlockchainAddress = _input.readAddress();
    const status: LotteryStatus = this.deserializeLotteryStatus(_input);
    const deadline: BN = _input.readI64();
    let winner: Option<BlockchainAddress> = undefined;
    const winner_isSome = _input.readBoolean();
    if (winner_isSome) {
      const winner_option: BlockchainAddress = _input.readAddress();
      winner = winner_option;
    }
    const entryCost: BN = _input.readUnsignedBigInteger(16);
    const prizePool: BN = _input.readUnsignedBigInteger(16);
    let secretStateId: Option<SecretVarId> = undefined;
    const secretStateId_isSome = _input.readBoolean();
    if (secretStateId_isSome) {
      const secretStateId_option: SecretVarId = this.deserializeSecretVarId(_input);
      secretStateId = secretStateId_option;
    }
    let pendingSecretStateId: Option<SecretVarId> = undefined;
    const pendingSecretStateId_isSome = _input.readBoolean();
    if (pendingSecretStateId_isSome) {
      const pendingSecretStateId_option: SecretVarId = this.deserializeSecretVarId(_input);
      pendingSecretStateId = pendingSecretStateId_option;
    }
    const entriesSvars_vecLength = _input.readI32();
    const entriesSvars: SecretVarId[] = [];
    for (let entriesSvars_i = 0; entriesSvars_i < entriesSvars_vecLength; entriesSvars_i++) {
      const entriesSvars_elem: SecretVarId = this.deserializeSecretVarId(_input);
      entriesSvars.push(entriesSvars_elem);
    }
    let winnerIndex: Option<BN> = undefined;
    const winnerIndex_isSome = _input.readBoolean();
    if (winnerIndex_isSome) {
      const winnerIndex_option: BN = _input.readUnsignedBigInteger(16);
      winnerIndex = winnerIndex_option;
    }
    return { lotteryId, creator, status, deadline, winner, entryCost, prizePool, secretStateId, pendingSecretStateId, entriesSvars, winnerIndex };
  }
  public deserializeLotteryStatus(_input: AbiInput): LotteryStatus {
    const discriminant = _input.readU8();
    if (discriminant === 1) {
      return this.deserializeLotteryStatusPending(_input);
    } else if (discriminant === 2) {
      return this.deserializeLotteryStatusOpen(_input);
    } else if (discriminant === 3) {
      return this.deserializeLotteryStatusClosed(_input);
    } else if (discriminant === 4) {
      return this.deserializeLotteryStatusComplete(_input);
    }
    throw new Error("Unknown discriminant: " + discriminant);
  }
  public deserializeLotteryStatusPending(_input: AbiInput): LotteryStatusPending {
    return { discriminant: LotteryStatusD.Pending,  };
  }
  public deserializeLotteryStatusOpen(_input: AbiInput): LotteryStatusOpen {
    return { discriminant: LotteryStatusD.Open,  };
  }
  public deserializeLotteryStatusClosed(_input: AbiInput): LotteryStatusClosed {
    return { discriminant: LotteryStatusD.Closed,  };
  }
  public deserializeLotteryStatusComplete(_input: AbiInput): LotteryStatusComplete {
    return { discriminant: LotteryStatusD.Complete,  };
  }
  public deserializeWorkListItem(_input: AbiInput): WorkListItem {
    const discriminant = _input.readU8();
    if (discriminant === 1) {
      return this.deserializeWorkListItemPendingAccountCreation(_input);
    } else if (discriminant === 2) {
      return this.deserializeWorkListItemPendingPurchaseCredits(_input);
    } else if (discriminant === 3) {
      return this.deserializeWorkListItemPendingRedeemCredits(_input);
    } else if (discriminant === 4) {
      return this.deserializeWorkListItemPendingLotteryCreation(_input);
    } else if (discriminant === 5) {
      return this.deserializeWorkListItemPendingLotteryTicketPurchase(_input);
    } else if (discriminant === 6) {
      return this.deserializeWorkListItemPendingEntropyPublish(_input);
    } else if (discriminant === 7) {
      return this.deserializeWorkListItemPendingDrawWinner(_input);
    } else if (discriminant === 8) {
      return this.deserializeWorkListItemPendingClaimPrize(_input);
    }
    throw new Error("Unknown discriminant: " + discriminant);
  }
  public deserializeWorkListItemPendingAccountCreation(_input: AbiInput): WorkListItemPendingAccountCreation {
    const account: BlockchainAddress = _input.readAddress();
    const accountKey: BN = _input.readUnsignedBigInteger(16);
    const accountCreationId: SecretVarId = this.deserializeSecretVarId(_input);
    return { discriminant: WorkListItemD.PendingAccountCreation, account, accountKey, accountCreationId };
  }
  public deserializeWorkListItemPendingPurchaseCredits(_input: AbiInput): WorkListItemPendingPurchaseCredits {
    const account: BlockchainAddress = _input.readAddress();
    const credits: BN = _input.readUnsignedBigInteger(16);
    return { discriminant: WorkListItemD.PendingPurchaseCredits, account, credits };
  }
  public deserializeWorkListItemPendingRedeemCredits(_input: AbiInput): WorkListItemPendingRedeemCredits {
    const account: BlockchainAddress = _input.readAddress();
    const credits: BN = _input.readUnsignedBigInteger(16);
    return { discriminant: WorkListItemD.PendingRedeemCredits, account, credits };
  }
  public deserializeWorkListItemPendingLotteryCreation(_input: AbiInput): WorkListItemPendingLotteryCreation {
    const account: BlockchainAddress = _input.readAddress();
    const lotteryId: BN = _input.readUnsignedBigInteger(16);
    const prizePool: BN = _input.readUnsignedBigInteger(16);
    const lotteryCreationId: SecretVarId = this.deserializeSecretVarId(_input);
    return { discriminant: WorkListItemD.PendingLotteryCreation, account, lotteryId, prizePool, lotteryCreationId };
  }
  public deserializeWorkListItemPendingLotteryTicketPurchase(_input: AbiInput): WorkListItemPendingLotteryTicketPurchase {
    const account: BlockchainAddress = _input.readAddress();
    const lotteryId: BN = _input.readUnsignedBigInteger(16);
    const ticketPurchaseId: SecretVarId = this.deserializeSecretVarId(_input);
    return { discriminant: WorkListItemD.PendingLotteryTicketPurchase, account, lotteryId, ticketPurchaseId };
  }
  public deserializeWorkListItemPendingEntropyPublish(_input: AbiInput): WorkListItemPendingEntropyPublish {
    const lotteryId: BN = _input.readUnsignedBigInteger(16);
    return { discriminant: WorkListItemD.PendingEntropyPublish, lotteryId };
  }
  public deserializeWorkListItemPendingDrawWinner(_input: AbiInput): WorkListItemPendingDrawWinner {
    const lotteryId: BN = _input.readUnsignedBigInteger(16);
    const winnerIndex: BN = _input.readUnsignedBigInteger(16);
    return { discriminant: WorkListItemD.PendingDrawWinner, lotteryId, winnerIndex };
  }
  public deserializeWorkListItemPendingClaimPrize(_input: AbiInput): WorkListItemPendingClaimPrize {
    const lotteryId: BN = _input.readUnsignedBigInteger(16);
    return { discriminant: WorkListItemD.PendingClaimPrize, lotteryId };
  }
  public async getState(): Promise<ContractState> {
    const bytes = await this._client?.getContractStateBinary(this._address!);
    if (bytes === undefined) {
      throw new Error("Unable to get state bytes");
    }
    const input = AbiByteInput.createLittleEndian(bytes);
    return this.deserializeContractState(input);
  }

}
export interface ContractState {
  token: BlockchainAddress;
  api: BlockchainAddress;
  userAccounts: AvlTreeMap<BlockchainAddress, SecretVarId>;
  uaAccountKeyMap: AvlTreeMap<BN, BlockchainAddress>;
  lotteryAccounts: AvlTreeMap<BN, SecretVarId>;
  lotteries: AvlTreeMap<BN, LotteryState>;
  workQueue: WorkListItem[];
  redundantVariables: SecretVarId[];
}

export interface SecretVarId {
  rawId: number;
}

export interface LotteryState {
  lotteryId: BN;
  creator: BlockchainAddress;
  status: LotteryStatus;
  deadline: BN;
  winner: Option<BlockchainAddress>;
  entryCost: BN;
  prizePool: BN;
  secretStateId: Option<SecretVarId>;
  pendingSecretStateId: Option<SecretVarId>;
  entriesSvars: SecretVarId[];
  winnerIndex: Option<BN>;
}

export enum LotteryStatusD {
  Pending = 1,
  Open = 2,
  Closed = 3,
  Complete = 4,
}
export type LotteryStatus =
  | LotteryStatusPending
  | LotteryStatusOpen
  | LotteryStatusClosed
  | LotteryStatusComplete;

export interface LotteryStatusPending {
  discriminant: LotteryStatusD.Pending;
}

export interface LotteryStatusOpen {
  discriminant: LotteryStatusD.Open;
}

export interface LotteryStatusClosed {
  discriminant: LotteryStatusD.Closed;
}

export interface LotteryStatusComplete {
  discriminant: LotteryStatusD.Complete;
}

export enum WorkListItemD {
  PendingAccountCreation = 1,
  PendingPurchaseCredits = 2,
  PendingRedeemCredits = 3,
  PendingLotteryCreation = 4,
  PendingLotteryTicketPurchase = 5,
  PendingEntropyPublish = 6,
  PendingDrawWinner = 7,
  PendingClaimPrize = 8,
}
export type WorkListItem =
  | WorkListItemPendingAccountCreation
  | WorkListItemPendingPurchaseCredits
  | WorkListItemPendingRedeemCredits
  | WorkListItemPendingLotteryCreation
  | WorkListItemPendingLotteryTicketPurchase
  | WorkListItemPendingEntropyPublish
  | WorkListItemPendingDrawWinner
  | WorkListItemPendingClaimPrize;

export interface WorkListItemPendingAccountCreation {
  discriminant: WorkListItemD.PendingAccountCreation;
  account: BlockchainAddress;
  accountKey: BN;
  accountCreationId: SecretVarId;
}

export interface WorkListItemPendingPurchaseCredits {
  discriminant: WorkListItemD.PendingPurchaseCredits;
  account: BlockchainAddress;
  credits: BN;
}

export interface WorkListItemPendingRedeemCredits {
  discriminant: WorkListItemD.PendingRedeemCredits;
  account: BlockchainAddress;
  credits: BN;
}

export interface WorkListItemPendingLotteryCreation {
  discriminant: WorkListItemD.PendingLotteryCreation;
  account: BlockchainAddress;
  lotteryId: BN;
  prizePool: BN;
  lotteryCreationId: SecretVarId;
}

export interface WorkListItemPendingLotteryTicketPurchase {
  discriminant: WorkListItemD.PendingLotteryTicketPurchase;
  account: BlockchainAddress;
  lotteryId: BN;
  ticketPurchaseId: SecretVarId;
}

export interface WorkListItemPendingEntropyPublish {
  discriminant: WorkListItemD.PendingEntropyPublish;
  lotteryId: BN;
}

export interface WorkListItemPendingDrawWinner {
  discriminant: WorkListItemD.PendingDrawWinner;
  lotteryId: BN;
  winnerIndex: BN;
}

export interface WorkListItemPendingClaimPrize {
  discriminant: WorkListItemD.PendingClaimPrize;
  lotteryId: BN;
}

export interface AccountCreationSecret {
  accountKey: BN;
}
function serializeAccountCreationSecret(_out: AbiOutput, _value: AccountCreationSecret): void {
  const { accountKey } = _value;
  _out.writeUnsignedBigInteger(accountKey, 16);
}

export interface LotteryCreationSecret {
  lotteryAccountKey: BN;
  creatorAccountKey: BN;
  randomSeed: BN;
}
function serializeLotteryCreationSecret(_out: AbiOutput, _value: LotteryCreationSecret): void {
  const { lotteryAccountKey, creatorAccountKey, randomSeed } = _value;
  _out.writeUnsignedBigInteger(lotteryAccountKey, 16);
  _out.writeUnsignedBigInteger(creatorAccountKey, 16);
  _out.writeUnsignedBigInteger(randomSeed, 16);
}

export interface LotteryTicketPurchaseSecret {
  lotteryAccountKey: BN;
  purchaserAccountKey: BN;
  tickets: BN;
  entropy: BN;
}
function serializeLotteryTicketPurchaseSecret(_out: AbiOutput, _value: LotteryTicketPurchaseSecret): void {
  const { lotteryAccountKey, purchaserAccountKey, tickets, entropy } = _value;
  _out.writeUnsignedBigInteger(lotteryAccountKey, 16);
  _out.writeUnsignedBigInteger(purchaserAccountKey, 16);
  _out.writeUnsignedBigInteger(tickets, 16);
  _out.writeUnsignedBigInteger(entropy, 16);
}

export function initialize(token: BlockchainAddress, api: BlockchainAddress): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("ffffffff0f", "hex"));
    _out.writeAddress(token);
    _out.writeAddress(api);
  });
}

export function continueQueue(): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from("10", "hex"));
  });
}

export function purchaseCredits(Credits: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from("20", "hex"));
    _out.writeUnsignedBigInteger(Credits, 16);
  });
}

export function redeemCredits(Credits: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from("21", "hex"));
    _out.writeUnsignedBigInteger(Credits, 16);
  });
}

export function drawWinner(lotteryId: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from("22", "hex"));
    _out.writeUnsignedBigInteger(lotteryId, 16);
  });
}

export function claim(lotteryId: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from("23", "hex"));
    _out.writeUnsignedBigInteger(lotteryId, 16);
  });
}

export function failInSeparateAction(errorMessage: string): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from("4c", "hex"));
    _out.writeString(errorMessage);
  });
}

export function createAccount(accountKey: BN): SecretInputBuilder<AccountCreationSecret> {
  const _publicRpc: Buffer = AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("40", "hex"));
    _out.writeUnsignedBigInteger(accountKey, 16);
  });
  const _secretInput = (secret_input_lambda: AccountCreationSecret): CompactBitArray => AbiBitOutput.serialize((_out) => {
    serializeAccountCreationSecret(_out, secret_input_lambda);
  });
  return new SecretInputBuilder(_publicRpc, _secretInput);
}

export function createLottery(lotteryId: BN, deadline: BN, entryCost: BN, prizePool: BN): SecretInputBuilder<LotteryCreationSecret> {
  const _publicRpc: Buffer = AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("41", "hex"));
    _out.writeUnsignedBigInteger(lotteryId, 16);
    _out.writeI64(deadline);
    _out.writeUnsignedBigInteger(entryCost, 16);
    _out.writeUnsignedBigInteger(prizePool, 16);
  });
  const _secretInput = (secret_input_lambda: LotteryCreationSecret): CompactBitArray => AbiBitOutput.serialize((_out) => {
    serializeLotteryCreationSecret(_out, secret_input_lambda);
  });
  return new SecretInputBuilder<>(_publicRpc, _secretInput);
}

export function purchaseTickets(lotteryId: BN): SecretInputBuilder<LotteryTicketPurchaseSecret> {
  const _publicRpc: Buffer = AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("42", "hex"));
    _out.writeUnsignedBigInteger(lotteryId, 16);
  });
  const _secretInput = (secret_input_lambda: LotteryTicketPurchaseSecret): CompactBitArray => AbiBitOutput.serialize((_out) => {
    serializeLotteryTicketPurchaseSecret(_out, secret_input_lambda);
  });
  return new SecretInputBuilder<>(_publicRpc, _secretInput);
}

export function deserializeState(state: StateWithClient): ContractState;
export function deserializeState(bytes: Buffer): ContractState;
export function deserializeState(
  bytes: Buffer,
  client: BlockchainStateClient,
  address: BlockchainAddress
): ContractState;
export function deserializeState(
  state: Buffer | StateWithClient,
  client?: BlockchainStateClient,
  address?: BlockchainAddress
): ContractState {
  if (Buffer.isBuffer(state)) {
    const input = AbiByteInput.createLittleEndian(state);
    return new LotteryApiGenerated(client, address).deserializeContractState(input);
  } else {
    const input = AbiByteInput.createLittleEndian(state.bytes);
    return new LotteryApiGenerated(
      state.client,
      state.address
    ).deserializeContractState(input);
  }
}

