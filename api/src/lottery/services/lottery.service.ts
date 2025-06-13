import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BlockchainAddress,
  BlockchainStateClientImpl,
} from '@partisiablockchain/abi-client';
import {
  ChainControllerApi,
  Configuration,
} from '@partisiablockchain/blockchain-api-transaction-client';
import {
  Client,
  CryptoUtils,
  RealZkClient,
  SignatureProviderKeyPair,
} from '@partisiablockchain/zk-client';
import { BitInput, CompactBitArray } from '@secata-public/bitmanipulation-ts';
import { SessionUser } from 'express-session';
import { Model } from 'mongoose';
import { SettingService } from 'src/settings/services/setting.service';
import { UserService } from 'src/users/services/user.service';
import { deserializeState } from 'src/utils/LotteryApiGenerated';
import { CreateLotteryPayload } from '../payloads/CreateLottery.payload';
import { GetLotteriesPayload } from '../payloads/GetLotteriesPayload';
import { Lottery } from '../schemas/lottery.schema';
import { OnChainLotteryContractState } from '../types/OnChainLotteryContractState';

@Injectable()
export class LotteryService {
  constructor(
    @InjectModel(Lottery.name)
    private readonly lotteryModel: Model<Lottery>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
  ) {}

  async getOnChainState(): Promise<OnChainLotteryContractState> {
    const settings = await this.settingService.findAll();

    const contractAddress = settings.find(
      (s) => s.name === 'contractAddress',
    )?.value;
    if (!contractAddress) {
      throw new Error('Contract address not found');
    }
    const partisiaClientUrl = settings.find(
      (s) => s.name === 'partisiaClientUrl',
    )?.value;
    if (!partisiaClientUrl) {
      throw new Error('Partisia client URL not found');
    }

    const client = new ChainControllerApi(
      new Configuration({
        basePath: partisiaClientUrl,
      }),
    );

    const contract = await client.getContract({
      address: contractAddress,
    });

    const shardId = contract.shardId;

    const endpoint = `shards/${shardId}/blockchain/contracts/${contractAddress}`;

    const response = await fetch(`${partisiaClientUrl}/${endpoint}`);

    const s = await response.json();

    const stateBuffer = Buffer.from(
      s.serializedContract.openState.openState.data,
      'base64',
    );

    const stateClient = BlockchainStateClientImpl.create(partisiaClientUrl);

    const deserialized = deserializeState(
      stateBuffer,
      stateClient,
      BlockchainAddress.fromString(contractAddress),
    );

    return {
      userAccounts: await deserialized.userAccounts
        .getNextN(void 0, await deserialized.userAccounts.size())
        .then((res) =>
          res.map((item) => ({
            address: item.key.asString(),
            rawId: item.value.rawId.toString(10),
          })),
        ),
      lotteries: await deserialized.lotteries
        .getNextN(void 0, await deserialized.lotteries.size())
        .then((res) =>
          res.map((item) => ({
            lotteryId: item.value.lotteryId.toString(10),
            creator: item.value.creator.asString(),
            status: item.value.status.discriminant,
            deadline: item.value.deadline.toString(10),
            entryCost: item.value.entryCost.toString(10),
            prizePool: item.value.prizePool.toString(10),
          })),
        ),
      lotteryAccounts: await deserialized.lotteryAccounts
        .getNextN(void 0, await deserialized.lotteryAccounts.size())
        .then((res) =>
          res.map((item) => ({
            lotteryId: item.key.toString(10),
            rawId: item.value.rawId.toString(10),
          })),
        ),
    };
  }

  async hasAccount(address: string): Promise<boolean> {
    const state = await this.getOnChainState();
    const account = state.userAccounts.find((a) => a.address === address);
    return !!account;
  }

  async getUserVarId(address: string): Promise<string | undefined> {
    const state = await this.getOnChainState();
    const account = state.userAccounts.find((a) => a.address === address);
    return account?.rawId;
  }

  async getUserBalance(address: string): Promise<string> {
    const myVarId = await this.getUserVarId(address);

    const pk = process.env.API_PRIVATE_KEY || null;

    if (!pk) {
      throw new Error('API private key not configured');
    }

    const settings = await this.settingService.findAll();
    const contractAddress = settings.find(
      (s) => s.name === 'contractAddress',
    )?.value;
    if (!contractAddress) {
      throw new Error('Contract address not found');
    }
    const partisiaClientUrl = settings.find(
      (s) => s.name === 'partisiaClientUrl',
    )?.value;
    if (!partisiaClientUrl) {
      throw new Error('Partisia client URL not found');
    }

    const client = new Client(partisiaClientUrl);
    const zkClient = RealZkClient.create(contractAddress, client);

    const owner = CryptoUtils.privateKeyToKeypair(pk);

    const reconstructedSecret: CompactBitArray =
      await zkClient.fetchSecretVariable(
        new SignatureProviderKeyPair(owner),
        Number(myVarId),
      );

    const reconstructedInt = new BitInput(
      reconstructedSecret.data.subarray(16, 32),
    ).readUnsignedBN(128);

    return reconstructedInt.toString(10);
  }

  async getUserAccountKey(address: string): Promise<string> {
    const myVarId = await this.getUserVarId(address);

    const pk = process.env.API_PRIVATE_KEY || null;

    if (!pk) {
      throw new Error('API private key not configured');
    }

    const settings = await this.settingService.findAll();
    const contractAddress = settings.find(
      (s) => s.name === 'contractAddress',
    )?.value;
    if (!contractAddress) {
      throw new Error('Contract address not found');
    }
    const partisiaClientUrl = settings.find(
      (s) => s.name === 'partisiaClientUrl',
    )?.value;
    if (!partisiaClientUrl) {
      throw new Error('Partisia client URL not found');
    }

    const client = new Client(partisiaClientUrl);
    const zkClient = RealZkClient.create(contractAddress, client);

    const owner = CryptoUtils.privateKeyToKeypair(pk);

    const reconstructedSecret: CompactBitArray =
      await zkClient.fetchSecretVariable(
        new SignatureProviderKeyPair(owner),
        Number(myVarId),
      );

    const reconstructedInt = new BitInput(
      reconstructedSecret.data,
    ).readUnsignedBN(128);

    return reconstructedInt.toString(10);
  }

  async createLottery(
    payload: CreateLotteryPayload,
    sessionUser: SessionUser,
  ): Promise<Lottery> {
    const user = await this.userService.findByAddress(sessionUser.address);

    if (!user) {
      throw new Error('User not found');
    }

    const lottery = new this.lotteryModel({
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user._id,
    });

    await lottery.save();
    return lottery;
  }

  async getLotteryById(
    lotteryId: string,
  ): Promise<(Omit<Lottery, 'status'> & { status: number }) | null> {
    const onChainState = await this.getOnChainState();

    const onChainLottery = onChainState.lotteries.find(
      (l) => l.lotteryId === lotteryId,
    );

    if (!onChainLottery) {
      throw new Error(`Lottery with ID ${lotteryId} not found on chain`);
    }

    const lottery = await this.lotteryModel.findOne({ lotteryId }).lean();

    if (!lottery) {
      throw new Error(`Lottery with ID ${lotteryId} not found in database`);
    }

    return {
      ...lottery,
      status: Number(onChainLottery.status),
    };
  }

  async getAllLotteriesPaginated(payload: GetLotteriesPayload): Promise<{
    lotteries: any[];
    total: number;
  }> {
    const { page = 1, limit = 10, status } = payload;
    const skip = (page - 1) * limit;

    const { lotteries: onChainLotteries } = await this.getOnChainState();

    const filteredLotteries = onChainLotteries.filter(
      (l) => Number(l.status) === Number(status),
    );

    const lotteries = await Promise.all(
      filteredLotteries.map(async (l) => {
        const lottery = await this.lotteryModel
          .findOne({ lotteryId: l.lotteryId })
          .lean();

        if (!lottery) {
          return null;
        }
        return {
          ...lottery,
          status: Number(l.status),
          lotteryId: l.lotteryId,
          creator: l.creator,
        };
      }),
    );

    return {
      lotteries: lotteries.slice(skip, skip + limit),
      total: lotteries.length,
    };
  }

  async getLotteryAccount(lotteryId: string): Promise<string | undefined> {
    const onChainState = await this.getOnChainState();
    const lottery = onChainState.lotteryAccounts.find(
      (l) => l.lotteryId === lotteryId,
    );

    if (!lottery) {
      throw new Error(`Lottery with ID ${lotteryId} not found on chain`);
    }

    const pk =
      '67f96d21e63c26022e8ec361e015058ca0def8ee3fa45415258344dd07b6d9f9';

    const settings = await this.settingService.findAll();

    const contractAddress = settings.find(
      (s) => s.name === 'contractAddress',
    )?.value;

    if (!contractAddress) {
      throw new Error('Contract address not found');
    }
    const partisiaClientUrl = settings.find(
      (s) => s.name === 'partisiaClientUrl',
    )?.value;

    if (!partisiaClientUrl) {
      throw new Error('Partisia client URL not found');
    }

    try {
      const client = new Client(partisiaClientUrl);
      const zkClient = RealZkClient.create(contractAddress, client);

      const owner = CryptoUtils.privateKeyToKeypair(pk);

      const reconstructedSecret: CompactBitArray =
        await zkClient.fetchSecretVariable(
          new SignatureProviderKeyPair(owner),
          Number(lottery.rawId),
        );

      const reconstructedInt = new BitInput(
        reconstructedSecret.data,
      ).readUnsignedBN(128);

      return reconstructedInt.toString(10);
    } catch (e: any) {
      console.error('Error fetching lottery account:', e?.message);
      throw new Error(
        `Failed to fetch lottery account for ID ${lotteryId}: ${e.message}`,
      );
    }
  }
}
