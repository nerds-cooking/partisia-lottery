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
import { CreateLotteryPayload } from '../payloads/CreateLottery.payload';
import { GetLotteriesPayload } from '../payloads/GetLotteriesPayload';
import { LotteryService } from '../services/lottery.service';

@Controller('lottery')
export class LotteryController {
  constructor(
    @Inject(forwardRef(() => LotteryService))
    private readonly lotteryService: LotteryService,
  ) {}

  @Get('/my-var-id')
  async myVarId(@RequestSession() session: RequestSessionType) {
    if (!session.user) {
      throw new Error('User not found in session');
    }

    try {
      const rawId = await this.lotteryService.getUserVarId(
        session.user.address,
      );
      return { rawId };
    } catch (e) {
      console.error('Error fetching lottery state:', e);
      throw new Error('Failed to fetch lottery state');
    }
  }

  @Get('/my-account-key')
  async myAccountKey(@RequestSession() session: RequestSessionType) {
    if (!session.user) {
      throw new Error('User not found in session');
    }

    try {
      const accountKey = await this.lotteryService.getUserAccountKey(
        session.user.address,
      );
      return { accountKey };
    } catch (e) {
      console.error('Error fetching lottery state:', e);
      throw new Error('Failed to fetch lottery state');
    }
  }

  @Get('/state')
  async getState(@RequestSession() session: RequestSessionType) {
    if (!session.user) {
      throw new Error('User not found in session');
    }

    try {
      const lottery = await this.lotteryService.getOnChainState();

      if (!lottery) {
        throw new Error('Lottery not found');
      }

      return lottery;
    } catch (e) {
      console.error('Error fetching lottery state:', e);
      throw new Error('Failed to fetch lottery state');
    }
  }

  @Get('/my-balance')
  async getMyBalance(@RequestSession() session: RequestSessionType) {
    if (!session.user) {
      throw new Error('User not found in session');
    }

    try {
      const balance = await this.lotteryService.getUserBalance(
        session.user.address,
      );
      return { balance };
    } catch (e) {
      console.error('Error fetching user balance:', e);
      throw new Error('Failed to fetch user balance');
    }
  }

  @Post('/')
  async createLottery(
    @Body() payload: CreateLotteryPayload,
    @RequestSession() session: RequestSessionType,
  ) {
    if (!session.user) {
      throw new Error('User not found in session');
    }

    try {
      const lottery = await this.lotteryService.createLottery(
        payload,
        session.user,
      );
      return { lottery };
    } catch (e) {
      console.error('Error creating lottery:', e);
      throw new Error('Failed to create lottery');
    }
  }

  @Get(':lotteryId')
  async getLotteryById(@Param('lotteryId') lotteryId: string) {
    try {
      const lottery = await this.lotteryService.getLotteryById(lotteryId);
      if (!lottery) {
        throw new Error('Lottery not found');
      }
      return { lottery };
    } catch (e) {
      console.error('Error fetching lottery by ID:', e);
      throw new Error('Failed to fetch lottery by ID');
    }
  }

  @Get('/')
  async getAllLotteries(@Query() query: GetLotteriesPayload) {
    try {
      const { lotteries, total } =
        await this.lotteryService.getAllLotteriesPaginated(query);
      return { lotteries, total };
    } catch (e) {
      console.error('Error fetching all lotteries:', e);
      throw new Error('Failed to fetch all lotteries');
    }
  }

  @Get(':lotteryId/account')
  async getLotteryAccount(
    @Param('lotteryId') lotteryId: string,
    @RequestSession() session: RequestSessionType,
  ) {
    if (!session.user) {
      throw new Error('User not found in session');
    }

    try {
      const lotteryAccount =
        await this.lotteryService.getLotteryAccount(lotteryId);
      return { lotteryAccount };
    } catch (e: any) {
      console.error('Error fetching lottery account:', e);
      throw new Error('Failed to fetch lottery account');
    }
  }
}
