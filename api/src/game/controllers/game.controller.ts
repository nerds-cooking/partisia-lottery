import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  RequestSession,
  RequestSessionType,
} from 'src/auth/decorators/request-session';
import { UserService } from 'src/users/services/user.service';
import { CreateGamePayload } from '../payloads/CreateGame.payload';
import { GameService } from '../services/game.service';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  @Post('/')
  async createGame(
    @Body() payload: CreateGamePayload,
    @RequestSession() session: RequestSessionType,
  ) {
    if (!session.user) {
      throw new Error('User not found in session');
    }

    try {
      return await this.gameService.createGame(payload, session.user);
    } catch (e) {
      console.error('Error creating game:', e);
      throw new Error('Failed to create game');
    }
  }

  @Get('/')
  async getGames(@Query('page') page: string, @Query('limit') limit: string) {
    try {
      const games = await this.gameService.getGames(
        Number(page || 1),
        Number(limit || 10),
      );

      const addresses: string[] = [];

      games.games.forEach((g) => {
        addresses.push(...(g.onChainGameState?.players || []));
        if (g.onChainGameState?.creator) {
          addresses.push(g.onChainGameState?.creator);
        }
      });

      const dedupedAddresses = Array.from(new Set(addresses));

      const users = await this.userService.findByAddresses(dedupedAddresses);

      const userMap: { [address: string]: string } = {};

      users.forEach((user) => {
        userMap[user.address] = user.username || user.address;
      });

      return {
        ...games,
        userMap,
      };
    } catch (e) {
      console.error('Error fetching games:', e);
      throw new Error('Failed to fetch games');
    }
  }

  @Get('/state')
  async getState(@RequestSession() session: RequestSessionType) {
    if (!session.user) {
      throw new Error('User not found in session');
    }

    try {
      const game = await this.gameService.getOnChainState();

      if (!game) {
        throw new Error('Game not found');
      }

      return game;
    } catch (e) {
      console.error('Error fetching game state:', e);
      throw new Error('Failed to fetch game state');
    }
  }

  @Get('/:gameId')
  async getGameById(@Param('gameId') gameId: string) {
    try {
      const game = await this.gameService.getGameById(gameId);

      if (!game) {
        throw new Error('Game not found');
      }

      // Fetch the on-chain game state
      const onChainGameState =
        await this.gameService.getOnChainGameState(gameId);
      if (!onChainGameState) {
        throw new Error('On-chain game state not found');
      }

      // Fetch users based on the players in the game
      const addresses = [
        ...(onChainGameState.players || []),
        onChainGameState.creator,
      ].filter((addr) => addr);

      const users = await this.userService.findByAddresses(addresses);
      const userMap: { [address: string]: string } = {};
      users.forEach((user) => {
        userMap[user.address] = user.username || user.address;
      });

      return {
        ...game.toObject(),
        onChainGameState,
        userMap,
      };
    } catch (e) {
      console.error('Error fetching game:', e);
      throw new Error('Failed to fetch game');
    }
  }
}
