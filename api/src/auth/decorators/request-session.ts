import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Session, SessionData } from 'express-session';

export const RequestSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.session;
  },
);

export type RequestSessionType = Session & Partial<SessionData>;
