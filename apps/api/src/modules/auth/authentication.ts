export type AuthPrincipal = Readonly<{
  accountId: string;
  email?: string;
}>;

export const AUTHENTICATION = Symbol('AUTHENTICATION');

export interface Authentication {
  verify(token: string): Promise<AuthPrincipal | null>;
}
