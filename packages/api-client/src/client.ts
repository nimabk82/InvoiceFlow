import { ApiRequestError } from './errors.js';
import type { HealthResponse } from './types.js';

export type TokenProvider = () => string | undefined;

export type ApiClientOptions = Readonly<{
  baseUrl: string;
  tokenProvider?: TokenProvider;
  fetchImpl?: typeof fetch;
}>;

export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenProvider?: TokenProvider;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.tokenProvider = options.tokenProvider;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    const token = this.tokenProvider?.();

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init?.headers as Record<string, string> | undefined),
        ...headers,
      },
    });

    if (!response.ok) {
      throw new ApiRequestError(
        response.status,
        `Request to ${path} failed with status ${response.status}`,
      );
    }

    return (await response.json()) as T;
  }
}
