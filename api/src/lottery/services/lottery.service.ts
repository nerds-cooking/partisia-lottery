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
import { LotteryEntry } from '../schemas/lottery-entries.schema';
import { Lottery } from '../schemas/lottery.schema';
import { OnChainLotteryContractState } from '../types/OnChainLotteryContractState';

@Injectable()
export class LotteryService {
  constructor(
    @InjectModel(Lottery.name)
    private readonly lotteryModel: Model<Lottery>,
    @InjectModel(LotteryEntry.name)
    private readonly lotteryEntriesModel: Model<LotteryEntry>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
  ) {}

  /**
   * Helper to fetch contractAddress and partisiaClientUrl from settings
   */
  private async getContractSettings() {
    const settings = await this.settingService.findAll();
    const contractAddress = settings.find(
      (s) => s.name === 'contractAddress',
    )?.value;
    if (!contractAddress) throw new Error('Contract address not found');
    const partisiaClientUrl = settings.find(
      (s) => s.name === 'partisiaClientUrl',
    )?.value;
    if (!partisiaClientUrl) throw new Error('Partisia client URL not found');
    return { contractAddress, partisiaClientUrl };
  }

  /**
   * Helper to create a ChainControllerApi client
   */
  private createChainControllerApi(partisiaClientUrl: string) {
    return new ChainControllerApi(
      new Configuration({ basePath: partisiaClientUrl }),
    );
  }

  /**
   * Helper to create a ZK Client
   */
  private createZkClient(contractAddress: string, partisiaClientUrl: string) {
    const client = new Client(partisiaClientUrl);
    return RealZkClient.create(contractAddress, client);
  }

  async getOnChainState(): Promise<OnChainLotteryContractState> {
    const { contractAddress, partisiaClientUrl } =
      await this.getContractSettings();

    const client = this.createChainControllerApi(partisiaClientUrl);

    const contract = await client.getContract({ address: contractAddress });

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
            winner: item.value?.winner?.asString() || null,
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

    if (!pk) throw new Error('API private key not configured');
    const { contractAddress, partisiaClientUrl } =
      await this.getContractSettings();

    const zkClient = this.createZkClient(contractAddress, partisiaClientUrl);

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
    if (!pk) throw new Error('API private key not configured');

    const { contractAddress, partisiaClientUrl } =
      await this.getContractSettings();

    const zkClient = this.createZkClient(contractAddress, partisiaClientUrl);

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

  async getLotteryById(lotteryId: string): Promise<
    | (Omit<Lottery, 'status'> & {
        status: number;
        creator: string;
        participants: string;
        winner: string | null;
        winnerUsername: string | null;
      })
    | null
  > {
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

    let user: any = null;
    if (onChainLottery.winner) {
      user = await this.userService.findByAddress(onChainLottery.winner);
    } else {
      user = null;
    }

    const participants = await this.lotteryEntriesModel
      .find({ lotteryId })
      .distinct('userId');
    const participantCount = participants.length;

    return {
      ...lottery,
      status: Number(onChainLottery.status),
      lotteryId: onChainLottery.lotteryId,
      creator: onChainLottery.creator,
      winner: onChainLottery.winner,
      winnerUsername: user ? user.username : null,
      participants: participantCount.toString(),
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

        const participants = await this.lotteryEntriesModel
          .find({ lotteryId: l.lotteryId })
          .distinct('userId');
        const participantCount = participants.length;
        let user: any = null;
        if (l.winner) {
          user = await this.userService.findByAddress(l.winner);
        } else {
          user = null;
        }

        if (!lottery) {
          return null;
        }
        return {
          ...lottery,
          status: Number(l.status),
          lotteryId: l.lotteryId,
          creator: l.creator,
          winner: l.winner,
          winnerUsername: user ? user.username : null,
          participants: participantCount,
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

    const pk = process.env.API_PRIVATE_KEY || null;
    if (!pk) throw new Error('API private key not configured');

    const { contractAddress, partisiaClientUrl } =
      await this.getContractSettings();
    try {
      const zkClient = this.createZkClient(contractAddress, partisiaClientUrl);
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

  async enterLottery(
    lotteryId: string,
    entryTxn: string,
    entryCost: string,
    entryCount: number,
    sessionUser: SessionUser,
  ): Promise<LotteryEntry> {
    const user = await this.userService.findByAddress(sessionUser.address);

    if (!user) {
      throw new Error('User not found');
    }

    const lotteryEntry = new this.lotteryEntriesModel({
      lotteryId,
      userId: user._id,
      entryTxn,
      entryCost,
      entryCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await lotteryEntry.save();
    return lotteryEntry;
  }

  async getUserLotteryEntries(
    address: string,
    page = 1,
    limit = 10,
  ): Promise<{ entries: any[]; total: number }> {
    const user = await this.userService.findByAddress(address);

    if (!user) {
      throw new Error('User not found');
    }

    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.lotteryEntriesModel
        .find({ userId: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.lotteryEntriesModel.countDocuments({ userId: user._id }),
    ]);

    const mappedEntries = await Promise.all(
      entries.map(async (entry) => {
        const lottery = await this.getLotteryById(entry.lotteryId);
        if (!lottery) {
          throw new Error(`Lottery with ID ${entry.lotteryId} not found`);
        }
        return {
          createdAt: entry.createdAt,
          lotteryId: entry.lotteryId,
          entryTxn: entry.entryTxn,
          entryCost: entry.entryCost,
          entryCount: entry.entryCount,
          lottery: {
            name: lottery.name,
            description: lottery.description,
          },
        };
      }),
    );

    return { entries: mappedEntries, total };
  }

  async getUserStats(address: string): Promise<{
    totalTickets: number;
    totalSpent: string;
    totalWins: string;
  }> {
    const user = await this.userService.findByAddress(address);

    if (!user) {
      throw new Error('User not found');
    }

    const entries = await this.lotteryEntriesModel
      .find({ userId: user._id })
      .lean();

    return {
      totalTickets: entries.reduce(
        (sum, entry) => sum + Number(entry.entryCount),
        0,
      ),
      totalSpent: entries
        .reduce(
          (sum, entry) =>
            sum + Number(entry.entryCost) * Number(entry.entryCount),
          0,
        )
        .toString(10),
      totalWins: '0',
    };
  }
}
