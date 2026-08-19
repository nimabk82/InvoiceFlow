import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from './auth.guard';
import type { AuthPrincipal } from './authentication';

export const CurrentAccount = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal | undefined => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.account;
  },
);
