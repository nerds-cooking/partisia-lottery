import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('username')
  async setUsername(@Body() body: { username: string }, @Req() req: Request) {
    const address = req.session?.user?.address;
    if (!address) {
      throw new UnauthorizedException('User not logged in');
    }

    return this.userService.updateUsername(address, body.username.trim());
  }
}
