import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  AUTHENTICATION,
  type Authentication,
  type AuthPrincipal,
} from './authentication';

export type AuthenticatedRequest = {
  headers: { authorization?: string };
  account?: AuthPrincipal;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTHENTICATION) private readonly authentication: Authentication,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException();
    }

    const account = await this.authentication.verify(token);

    if (!account) {
      throw new UnauthorizedException();
    }

    request.account = account;
    return true;
  }
}

function extractBearerToken(
  authorizationHeader: string | undefined,
): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }

  return token;
}
