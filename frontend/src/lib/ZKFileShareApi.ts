// This file is auto-generated from an abi-file using AbiCodegen.
/* eslint-disable */
// @ts-nocheck
// noinspection ES6UnusedImports
import {
  AbiBitOutput,
  AbiByteInput,
  AbiByteOutput,
  AbiInput,
  BlockchainAddress,
  BlockchainStateClient,
  SecretInputBuilder,
  StateWithClient
} from '@partisiablockchain/abi-client';

type Option<K> = K | undefined;
export class ZKFileShareApi {
  private readonly _client: BlockchainStateClient | undefined;
  private readonly _address: BlockchainAddress | undefined;

  public constructor(
    client: BlockchainStateClient | undefined,
    address: BlockchainAddress | undefined
  ) {
    this._address = address;
    this._client = client;
  }
  public deserializeCollectionState(_input: AbiInput): CollectionState {
    return {};
  }
  public async getState(): Promise<CollectionState> {
    const bytes = await this._client?.getContractStateBinary(this._address!);
    if (bytes === undefined) {
      throw new Error('Unable to get state bytes');
    }
    const input = AbiByteInput.createLittleEndian(bytes);
    return this.deserializeCollectionState(input);
  }
}
export interface CollectionState {}

export function initialize(): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from('ffffffff0f', 'hex'));
  });
}

export function changeFileOwner(
  fileId: number,
  newOwner: BlockchainAddress
): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from('03', 'hex'));
    _out.writeU32(fileId);
    _out.writeAddress(newOwner);
  });
}

export function deleteFile(fileId: number): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeU8(0x09);
    _out.writeBytes(Buffer.from('05', 'hex'));
    _out.writeU32(fileId);
  });
}

export function addFile(fileLength: number): SecretInputBuilder<number[]> {
  const _publicRpc: Buffer = AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from('42', 'hex'));
    _out.writeU32(fileLength);
  });
  const _secretInput = (secret_input_lambda: number[]): CompactBitArray =>
    AbiBitOutput.serialize((_out) => {
      _out.writeI32(secret_input_lambda.length);
      for (const secret_input_lambda_vec of secret_input_lambda) {
        _out.writeI8(secret_input_lambda_vec);
      }
    });
  return new SecretInputBuilder(_publicRpc, _secretInput);
}

export function deserializeState(state: StateWithClient): CollectionState;
export function deserializeState(bytes: Buffer): CollectionState;
export function deserializeState(
  bytes: Buffer,
  client: BlockchainStateClient,
  address: BlockchainAddress
): CollectionState;
export function deserializeState(
  state: Buffer | StateWithClient,
  client?: BlockchainStateClient,
  address?: BlockchainAddress
): CollectionState {
  if (Buffer.isBuffer(state)) {
    const input = AbiByteInput.createLittleEndian(state);
    return new ZKFileShareApi(client, address).deserializeCollectionState(
      input
    );
  } else {
    const input = AbiByteInput.createLittleEndian(state.bytes);
    return new ZKFileShareApi(
      state.client,
      state.address
    ).deserializeCollectionState(input);
  }
}
