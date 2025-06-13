import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  RequestSession,
  RequestSessionType,
} from 'src/auth/decorators/request-session';
import { LotteryService } from 'src/lottery/services/lottery.service';
import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => LotteryService))
    private readonly lotteryService: LotteryService,
  ) {}

  @Post('username')
  async setUsername(@Body() body: { username: string }, @Req() req: Request) {
    const address = req.session?.user?.address;
    if (!address) {
      throw new UnauthorizedException('User not logged in');
    }

    return this.userService.updateUsername(address, body.username.trim());
  }

  @Get('has-account')
  async hasAccount(@RequestSession() session: RequestSessionType) {
    if (!session.user) {
      throw new UnauthorizedException('User not found in session');
    }

    const hasAccount = await this.lotteryService.hasAccount(
      session.user.address,
    );
    return { hasAccount };
  }
}

// Make sure your UserModule imports LotteryModule with forwardRef
// In your UserModule (not shown here), do:
// imports: [forwardRef(() => LotteryModule)],
