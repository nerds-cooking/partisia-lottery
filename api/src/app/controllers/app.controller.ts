import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CsrfMiddleware } from '../../middleware/csrf.middleware';

@Controller()
export class AppController {
  constructor(private readonly csrfMiddleware: CsrfMiddleware) {}

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    const token = this.csrfMiddleware.generateCsrfToken(req, res);

    res.json({ csrfToken: token });
  }
}
