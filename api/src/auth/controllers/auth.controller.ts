import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from 'src/users/services/user.service';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    // Ensure the user is logged in
    if (!req.session || !req.session.user) {
      throw new UnauthorizedException('Not logged in');
    }

    const user = await this.userService.findByAddress(req.session.user.address);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return the user info from the session
    return {
      id: user._id,
      address: user.address,
      username: user.username,
    };
  }

  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).send({ message: 'Failed to log out' });
      }

      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return res.send({ message: 'Logged out successfully' });
    });
  }

  @Get('nonce')
  async getNonce(@Query('pub') pub: string) {
    return this.authService.generateNonce(pub);
  }

  @Post('login')
  async verifySignature(
    @Body() body: { address: string; signature: string },
    @Req() req: Request,
  ) {
    return this.authService.verifySignature(
      {
        address: body.address,
        signature: body.signature,
      },
      req,
    );
  }
}
