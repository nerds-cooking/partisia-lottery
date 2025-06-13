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
export class TestTokenGenerated {
  private readonly _client: BlockchainStateClient | undefined;
  private readonly _address: BlockchainAddress | undefined;
  
  public constructor(
    client: BlockchainStateClient | undefined,
    address: BlockchainAddress | undefined
  ) {
    this._address = address;
    this._client = client;
  }
  public deserializeTokenState(_input: AbiInput): TokenState {
    const name: string = _input.readString();
    const decimals: number = _input.readU8();
    const symbol: string = _input.readString();
    const owner: BlockchainAddress = _input.readAddress();
    const totalSupply: BN = _input.readUnsignedBigInteger(16);
    const balances_treeId = _input.readI32();
    const balances: AvlTreeMap<BlockchainAddress, BN> = new AvlTreeMap(
      balances_treeId,
      this._client,
      this._address,
      (balances_key) => AbiByteOutput.serializeLittleEndian((balances_out) => {
        balances_out.writeAddress(balances_key);
      }),
      (balances_bytes) => {
        const balances_input = AbiByteInput.createLittleEndian(balances_bytes);
        const balances_key: BlockchainAddress = balances_input.readAddress();
        return balances_key;
      },
      (balances_bytes) => {
        const balances_input = AbiByteInput.createLittleEndian(balances_bytes);
        const balances_value: BN = balances_input.readUnsignedBigInteger(16);
        return balances_value;
      }
    );
    const allowed_treeId = _input.readI32();
    const allowed: AvlTreeMap<AllowedAddress, BN> = new AvlTreeMap(
      allowed_treeId,
      this._client,
      this._address,
      (allowed_key) => AbiByteOutput.serializeLittleEndian((allowed_out) => {
        serializeAllowedAddress(allowed_out, allowed_key);
      }),
      (allowed_bytes) => {
        const allowed_input = AbiByteInput.createLittleEndian(allowed_bytes);
        const allowed_key: AllowedAddress = this.deserializeAllowedAddress(allowed_input);
        return allowed_key;
      },
      (allowed_bytes) => {
        const allowed_input = AbiByteInput.createLittleEndian(allowed_bytes);
        const allowed_value: BN = allowed_input.readUnsignedBigInteger(16);
        return allowed_value;
      }
    );
    return { name, decimals, symbol, owner, totalSupply, balances, allowed };
  }
  public deserializeAllowedAddress(_input: AbiInput): AllowedAddress {
    const owner: BlockchainAddress = _input.readAddress();
    const spender: BlockchainAddress = _input.readAddress();
    return { owner, spender };
  }
  public async getState(): Promise<TokenState> {
    const bytes = await this._client?.getContractStateBinary(this._address!);
    if (bytes === undefined) {
      throw new Error("Unable to get state bytes");
    }
    const input = AbiByteInput.createLittleEndian(bytes);
    return this.deserializeTokenState(input);
  }

}
export interface TokenState {
  name: string;
  decimals: number;
  symbol: string;
  owner: BlockchainAddress;
  totalSupply: BN;
  balances: AvlTreeMap<BlockchainAddress, BN>;
  allowed: AvlTreeMap<AllowedAddress, BN>;
}

export interface AllowedAddress {
  owner: BlockchainAddress;
  spender: BlockchainAddress;
}
function serializeAllowedAddress(_out: AbiOutput, _value: AllowedAddress): void {
  const { owner, spender } = _value;
  _out.writeAddress(owner);
  _out.writeAddress(spender);
}

export interface Transfer {
  to: BlockchainAddress;
  amount: BN;
}
function serializeTransfer(_out: AbiOutput, _value: Transfer): void {
  const { to, amount } = _value;
  _out.writeAddress(to);
  _out.writeUnsignedBigInteger(amount, 16);
}

export function initialize(name: string, symbol: string, decimals: number, totalSupply: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("ffffffff0f", "hex"));
    _out.writeString(name);
    _out.writeString(symbol);
    _out.writeU8(decimals);
    _out.writeUnsignedBigInteger(totalSupply, 16);
  });
}

export function transfer(to: BlockchainAddress, amount: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("01", "hex"));
    _out.writeAddress(to);
    _out.writeUnsignedBigInteger(amount, 16);
  });
}

export function bulkTransfer(transfers: Transfer[]): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("02", "hex"));
    _out.writeI32(transfers.length);
    for (const transfers_vec of transfers) {
      serializeTransfer(_out, transfers_vec);
    }
  });
}

export function transferFrom(from: BlockchainAddress, to: BlockchainAddress, amount: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("03", "hex"));
    _out.writeAddress(from);
    _out.writeAddress(to);
    _out.writeUnsignedBigInteger(amount, 16);
  });
}

export function bulkTransferFrom(from: BlockchainAddress, transfers: Transfer[]): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("04", "hex"));
    _out.writeAddress(from);
    _out.writeI32(transfers.length);
    for (const transfers_vec of transfers) {
      serializeTransfer(_out, transfers_vec);
    }
  });
}

export function approve(spender: BlockchainAddress, amount: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("05", "hex"));
    _out.writeAddress(spender);
    _out.writeUnsignedBigInteger(amount, 16);
  });
}

export function approveRelative(spender: BlockchainAddress, delta: BN): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("07", "hex"));
    _out.writeAddress(spender);
    _out.writeSignedBigInteger(delta, 16);
  });
}

export function deserializeState(state: StateWithClient): TokenState;
export function deserializeState(bytes: Buffer): TokenState;
export function deserializeState(
  bytes: Buffer,
  client: BlockchainStateClient,
  address: BlockchainAddress
): TokenState;
export function deserializeState(
  state: Buffer | StateWithClient,
  client?: BlockchainStateClient,
  address?: BlockchainAddress
): TokenState {
  if (Buffer.isBuffer(state)) {
    const input = AbiByteInput.createLittleEndian(state);
    return new TestTokenGenerated(client, address).deserializeTokenState(input);
  } else {
    const input = AbiByteInput.createLittleEndian(state.bytes);
    return new TestTokenGenerated(
      state.client,
      state.address
    ).deserializeTokenState(input);
  }
}

