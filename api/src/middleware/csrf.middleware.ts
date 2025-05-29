import { Injectable, NestMiddleware } from '@nestjs/common';
import { doubleCsrf } from 'csrf-csrf';
import { NextFunction, Request, Response } from 'express';

const { generateToken, validateRequest } = doubleCsrf({
  getSecret: () => {
    return process.env.CSRF_SECRET!;
  },
  cookieName: '__csrf', // Name of the CSRF token cookie
  getTokenFromRequest: (req: Request) => {
    const token = req.headers['x-csrf-token'] as string;

    return token;
  },
});

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF validation for safe HTTP methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    try {
      const valid = validateRequest(req);
      if (valid) {
        return next();
      }
    } catch (error) {
      console.error('CSRF validation error:', error.message);
    }

    console.log('CSRF token is invalid');
    return res.status(403).send('Forbidden');
  }

  generateCsrfToken(req: Request, res: Response) {
    return generateToken(req, res, false, true);
  }
}
