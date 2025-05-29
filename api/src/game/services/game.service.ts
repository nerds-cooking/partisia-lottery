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
import { SessionUser } from 'express-session';
import { Model } from 'mongoose';
import { SettingService } from 'src/settings/services/setting.service';
import { UserService } from '../../users/services/user.service';
import { CreateGamePayload } from '../payloads/CreateGame.payload';
import { Game } from '../schemas/game.schema';
import { OnChainGameState } from '../types/OnChainGameState';
import {
  deserializeState,
  GameState,
  GameStatusD,
} from '../utils/TriviaApiGenerated';

@Injectable()
export class GameService {
  constructor(
    private readonly userService: UserService,
    @InjectModel(Game.name)
    private readonly gameModel: Model<Game>,
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
  ) {}

  async createGame(
    payload: CreateGamePayload,
    sessionUser: SessionUser,
  ): Promise<Game> {
    const user = await this.userService.findByAddress(sessionUser.address);

    if (!user) {
      throw new Error('User not found');
    }

    const state = await this.getOnChainGameState(payload.gameId);

    let updatedState = state;
    if (state && state.gameStatus !== GameStatusD.InProgress) {
      const maxAttempts = 10;
      let attempts = 0;

      while (
        updatedState &&
        updatedState.gameStatus !== GameStatusD.InProgress &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        updatedState = await this.getOnChainGameState(payload.gameId);
        attempts++;
      }
    }

    const game = new this.gameModel({
      ...payload,
      creator: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await game.save();
    return game;
  }

  async getGameById(gameId: string): Promise<Game | null> {
    return this.gameModel.findOne({ gameId }).exec();
  }

  async getGamesByCategory(category: string): Promise<Game[]> {
    return this.gameModel
      .find({ category })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async getGamesByCreator(creatorId: string): Promise<Game[]> {
    return this.gameModel
      .find({ creator: creatorId })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async getGames(
    page: number,
    limit: number,
  ): Promise<{
    games: Array<Game & { onChainGameState?: OnChainGameState }>;
    totalItems: number;
    totalPages: number;
    page: number;
  }> {
    const games = (await this.gameModel
      .find()
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .select({
        _id: 1,
        gameId: 1,
        name: 1,
        description: 1,
        category: 1,
        createdAt: 1,
        deadline: 1,
      })
      .exec()) as unknown as Array<
      Game & { onChainGameState: OnChainGameState }
    >;

    const totalItems = await this.gameModel.countDocuments().exec();
    const totalPages = Math.ceil(totalItems / limit);

    const onChainState = await this.getOnChainState();

    return {
      games: games.map((game) => {
        const onChainGameState = onChainState.games.find(
          (g) => g.gameId === Number(game.gameId),
        );

        return {
          ...game.toObject(),
          onChainGameState: onChainGameState,
        };
      }),
      totalItems,
      totalPages,
      page,
    };
  }

  async getOnChainState(): Promise<{
    gameIds: number[];
    games: OnChainGameState[];
  }> {
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

    const desWithFixedTypes = {
      ...deserialized,
      gameIds: await deserialized.gameIds.innerMap
        .getNextN(void 0, await deserialized.gameIds.innerMap.size())
        .then((entries) => entries.map((a) => a.key)),
      games: await Promise.all(
        deserialized.games.map(async (game: GameState) => ({
          ...game,
          creator: game.creator.asString(),
          gameStatus: game.gameStatus.discriminant,
          gameDeadline: game.gameDeadline.toString(10),
          players: await game.players.innerMap
            .getNextN(void 0, await game.players.innerMap.size())
            .then((entries) => entries.map((a) => a.key.asString())),
          gameDataSvar: {
            rawId: game.gameDataSvar?.rawId.toString(10) || '',
          },
          entriesSvars: game.entriesSvars.map((a) => ({
            rawId: a.rawId.toString(10),
          })),
          resultsSvars: game.resultsSvars.map((a) => ({
            rawId: a.rawId.toString(10),
          })),
          leaderboard: game.leaderboard
            .map((a) => ({
              ...a,
              player: a.player.asString(),
            }))
            .sort((a, b) => b.score - a.score),
        })),
      ),
    };

    return desWithFixedTypes;
  }

  async getOnChainGameState(
    gameId: string | number,
    maxRetries = 3,
    initialDelay = 1000,
  ): Promise<any> {
    let retries = 0;
    let delay = initialDelay;

    while (true) {
      try {
        const gameState = await this.getOnChainState();
        const game = gameState.games.find(
          (g: any) => g.gameId === Number(gameId),
        );

        if (!game) {
          throw new Error('Game not found');
        }

        return game;
      } catch (error) {
        if (retries >= maxRetries) {
          console.error(
            `Failed to get on-chain game state after ${maxRetries} retries:`,
            error,
          );
          throw error;
        }

        const isRateLimitError =
          error.response?.status === 429 ||
          error.message?.includes('rate limit') ||
          error.message?.includes('too many requests');

        if (!isRateLimitError) {
          throw error;
        }

        retries++;
        console.log(
          `Rate limit hit, retrying (${retries}/${maxRetries}) after ${delay}ms delay`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));

        delay *= 2;
      }
    }
  }
}
