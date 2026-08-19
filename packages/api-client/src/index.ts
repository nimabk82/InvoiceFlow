export type HealthResponse = Readonly<{
  environment: string;
  service: 'invoiceflow-api';
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}>;

export type Business = Readonly<{
  id: string;
  ownerAccountId: string;
  name: string;
  countryCode: string;
  currencyCode: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  logoAssetId?: string;
}>;

export type CreateBusinessInput = Readonly<{
  name: string;
  countryCode: string;
  currencyCode: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  logoAssetId?: string;
}>;

export type ClientEmail = Readonly<{
  id: string;
  address: string;
  isPrimary: boolean;
}>;

export type Client = Readonly<{
  id: string;
  name?: string;
  company?: string;
  emails: readonly ClientEmail[];
}>;

export type ClientPage = Readonly<{
  items: readonly Client[];
}>;

export type ProductService = Readonly<{
  id: string;
  type: 'product' | 'service';
  name: string;
  description?: string;
  defaultRate?: string;
  unit?: string;
}>;

export type ProductServicePage = Readonly<{
  items: readonly ProductService[];
}>;

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

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

  async createBusiness(
    input: CreateBusinessInput,
    token: string,
  ): Promise<Business> {
    return this.request<Business>('/businesses', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async listBusinesses(token: string): Promise<Business[]> {
    return this.request<Business[]>('/businesses', {
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async listClients(
    businessId: string,
    token: string,
  ): Promise<ClientPage> {
    return this.request<ClientPage>(
      `/businesses/${businessId}/clients`,
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async listProducts(
    businessId: string,
    token: string,
  ): Promise<ProductServicePage> {
    return this.request<ProductServicePage>(
      `/businesses/${businessId}/products`,
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
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
