// This file is auto-generated from an abi-file using AbiCodegen.
/* eslint-disable */
// @ts-nocheck
// noinspection ES6UnusedImports
import {
  AbiBitInput,
  AbiBitOutput,
  AbiByteInput,
  AbiByteOutput,
  AbiInput,
  AbiOutput,
  AvlTreeMap,
  BlockchainAddress,
  BlockchainPublicKey,
  BlockchainStateClient,
  BlsPublicKey,
  BlsSignature,
  BN,
  Hash,
  Signature,
  StateWithClient,
  SecretInputBuilder,
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
    const accounts_treeId = _input.readI32();
    const accounts: AvlTreeMap<BlockchainAddress, SecretVarId> = new AvlTreeMap(
      accounts_treeId,
      this._client,
      this._address,
      (accounts_key) => AbiByteOutput.serializeLittleEndian((accounts_out) => {
        accounts_out.writeAddress(accounts_key);
      }),
      (accounts_bytes) => {
        const accounts_input = AbiByteInput.createLittleEndian(accounts_bytes);
        const accounts_key: BlockchainAddress = accounts_input.readAddress();
        return accounts_key;
      },
      (accounts_bytes) => {
        const accounts_input = AbiByteInput.createLittleEndian(accounts_bytes);
        const accounts_value: SecretVarId = this.deserializeSecretVarId(accounts_input);
        return accounts_value;
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
    return { accounts, workQueue, redundantVariables };
  }
  public deserializeSecretVarId(_input: AbiInput): SecretVarId {
    const rawId: number = _input.readU32();
    return { rawId };
  }
  public deserializeWorkListItem(_input: AbiInput): WorkListItem {
    const discriminant = _input.readU8();
    if (discriminant === 1) {
      return this.deserializeWorkListItemPendingAccountCreation(_input);
    }
    throw new Error("Unknown discriminant: " + discriminant);
  }
  public deserializeWorkListItemPendingAccountCreation(_input: AbiInput): WorkListItemPendingAccountCreation {
    const account: BlockchainAddress = _input.readAddress();
    const accountCreationId: SecretVarId = this.deserializeSecretVarId(_input);
    return { discriminant: WorkListItemD.PendingAccountCreation, account, accountCreationId };
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
  accounts: AvlTreeMap<BlockchainAddress, SecretVarId>;
  workQueue: WorkListItem[];
  redundantVariables: SecretVarId[];
}

export interface SecretVarId {
  rawId: number;
}

export enum WorkListItemD {
  PendingAccountCreation = 1,
}
export type WorkListItem =
  | WorkListItemPendingAccountCreation;

export interface WorkListItemPendingAccountCreation {
  discriminant: WorkListItemD.PendingAccountCreation;
  account: BlockchainAddress;
  accountCreationId: SecretVarId;
}

export interface AccountCreationSecret {
  accountKey: BN;
}
function serializeAccountCreationSecret(_out: AbiOutput, _value: AccountCreationSecret): void {
  const { accountKey } = _value;
  _out.writeUnsignedBigInteger(accountKey, 16);
}

export function initialize(): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("ffffffff0f", "hex"));
  });
}

export function createAccount(): SecretInputBuilder<AccountCreationSecret> {
  const _publicRpc: Buffer = AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("40", "hex"));
  });
  const _secretInput = (secret_input_lambda: AccountCreationSecret): CompactBitArray => AbiBitOutput.serialize((_out) => {
    serializeAccountCreationSecret(_out, secret_input_lambda);
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

