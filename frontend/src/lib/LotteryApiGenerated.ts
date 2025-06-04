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
    const tokenDecimals: number = _input.readU32();
    const accounts_treeId = _input.readI32();
    const accounts: AvlTreeMap<BlockchainAddress, SecretVarId> = new AvlTreeMap(
      accounts_treeId,
      this._client,
      this._address,
      (accounts_key) =>
        AbiByteOutput.serializeLittleEndian((accounts_out) => {
          accounts_out.writeAddress(accounts_key);
        }),
      (accounts_bytes) => {
        const accounts_input = AbiByteInput.createLittleEndian(accounts_bytes);
        const accounts_key: BlockchainAddress = accounts_input.readAddress();
        return accounts_key;
      },
      (accounts_bytes) => {
        const accounts_input = AbiByteInput.createLittleEndian(accounts_bytes);
        const accounts_value: SecretVarId =
          this.deserializeSecretVarId(accounts_input);
        return accounts_value;
      }
    );
    const workQueue_vecLength = _input.readI32();
    const workQueue: WorkListItem[] = [];
    for (
      let workQueue_i = 0;
      workQueue_i < workQueue_vecLength;
      workQueue_i++
    ) {
      const workQueue_elem: WorkListItem = this.deserializeWorkListItem(_input);
      workQueue.push(workQueue_elem);
    }
    const redundantVariables_vecLength = _input.readI32();
    const redundantVariables: SecretVarId[] = [];
    for (
      let redundantVariables_i = 0;
      redundantVariables_i < redundantVariables_vecLength;
      redundantVariables_i++
    ) {
      const redundantVariables_elem: SecretVarId =
        this.deserializeSecretVarId(_input);
      redundantVariables.push(redundantVariables_elem);
    }
    return { token, tokenDecimals, accounts, workQueue, redundantVariables };
  }
  public deserializeSecretVarId(_input: AbiInput): SecretVarId {
    const rawId: number = _input.readU32();
    return { rawId };
  }
  public deserializeWorkListItem(_input: AbiInput): WorkListItem {
    const discriminant = _input.readU8();
    if (discriminant === 1) {
      return this.deserializeWorkListItemPendingAccountCreation(_input);
    } else if (discriminant === 2) {
      return this.deserializeWorkListItemPendingPurchaseCredits(_input);
    } else if (discriminant === 3) {
      return this.deserializeWorkListItemPendingRedeemCredits(_input);
    }
    throw new Error('Unknown discriminant: ' + discriminant);
  }
  public deserializeWorkListItemPendingAccountCreation(
    _input: AbiInput
  ): WorkListItemPendingAccountCreation {
    const account: BlockchainAddress = _input.readAddress();
    const accountCreationId: SecretVarId = this.deserializeSecretVarId(_input);
    return {
      discriminant: WorkListItemD.PendingAccountCreation,
      account,
      accountCreationId,
    };
  }
  public deserializeWorkListItemPendingPurchaseCredits(
    _input: AbiInput
  ): WorkListItemPendingPurchaseCredits {
    const account: BlockchainAddress = _input.readAddress();
    const credits: BN = _input.readUnsignedBigInteger(16);
    return {
      discriminant: WorkListItemD.PendingPurchaseCredits,
      account,
      credits,
    };
  }
  public deserializeWorkListItemPendingRedeemCredits(
    _input: AbiInput
  ): WorkListItemPendingRedeemCredits {
    const account: BlockchainAddress = _input.readAddress();
    const credits: BN = _input.readUnsignedBigInteger(16);
    return {
      discriminant: WorkListItemD.PendingRedeemCredits,
      account,
      credits,
    };
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
  token: BlockchainAddress;
  tokenDecimals: number;
  accounts: AvlTreeMap<BlockchainAddress, SecretVarId>;
  workQueue: WorkListItem[];
  redundantVariables: SecretVarId[];
}

export interface SecretVarId {
  rawId: number;
}

export enum WorkListItemD {
  PendingAccountCreation = 1,
  PendingPurchaseCredits = 2,
  PendingRedeemCredits = 3,
}
export type WorkListItem =
  | WorkListItemPendingAccountCreation
  | WorkListItemPendingPurchaseCredits
  | WorkListItemPendingRedeemCredits;

export interface WorkListItemPendingAccountCreation {
  discriminant: WorkListItemD.PendingAccountCreation;
  account: BlockchainAddress;
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

export interface AccountCreationSecret {
  accountKey: BN;
}
function serializeAccountCreationSecret(
  _out: AbiOutput,
  _value: AccountCreationSecret
): void {
  const { accountKey } = _value;
  _out.writeUnsignedBigInteger(accountKey, 16);
}

export function initialize(
  token: BlockchainAddress,
  tokenDecimals: number
): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from('ffffffff0f', 'hex'));
    _out.writeAddress(token);
    _out.writeU32(tokenDecimals);
  });
}

export function continueQueue(): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from('10', 'hex'));
  });
}

export function purchaseCredits(Credits: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from('20', 'hex'));
    _out.writeUnsignedBigInteger(Credits, 16);
  });
}

export function redeemCredits(Credits: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from('21', 'hex'));
    _out.writeUnsignedBigInteger(Credits, 16);
  });
}

export function failInSeparateAction(errorMessage: string): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from('4c', 'hex'));
    _out.writeString(errorMessage);
  });
}

export function createAccount(): SecretInputBuilder<AccountCreationSecret> {
  const _publicRpc: Buffer = AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from('40', 'hex'));
  });
  const _secretInput = (
    secret_input_lambda: AccountCreationSecret
  ): CompactBitArray =>
    AbiBitOutput.serialize((_out) => {
      serializeAccountCreationSecret(_out, secret_input_lambda);
    });
  return new SecretInputBuilder(_publicRpc, _secretInput);
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
    return new LotteryApiGenerated(client, address).deserializeContractState(
      input
    );
  } else {
    const input = AbiByteInput.createLittleEndian(state.bytes);
    return new LotteryApiGenerated(
      state.client,
      state.address
    ).deserializeContractState(input);
  }
}
