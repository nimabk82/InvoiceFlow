import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthPrincipal } from '../../auth/authentication';
import { BusinessAccessService } from './business-access.service';

type BusinessRequest = {
  account?: AuthPrincipal;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

@Injectable()
export class BusinessAccessGuard implements CanActivate {
  constructor(private readonly access: BusinessAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<BusinessRequest>();

    if (!request.account) {
      throw new UnauthorizedException();
    }

    const businessId = extractBusinessId(request);

    if (!businessId) {
      throw new ForbiddenException();
    }

    await this.access.assertMember(request.account.accountId, businessId);
    return true;
  }
}

function extractBusinessId(request: BusinessRequest): string | undefined {
  const sources = [request.params, request.query, request.body] as const;

  for (const source of sources) {
    const businessId = source?.businessId;

    if (typeof businessId === 'string') {
      return businessId;
    }
  }

  return undefined;
}
