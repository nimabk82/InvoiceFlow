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
  address?: Readonly<{
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    countryCode?: string;
  }>;
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
  address?: Readonly<{
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    countryCode?: string;
  }>;
  logoAssetId?: string;
}>;

export type DocumentDefaults = Readonly<{
  businessId: string;
  defaultDueRule?: string;
  defaultNotes?: string;
  defaultTerms?: string;
  defaultInvoiceThemeId?: string;
  defaultQuoteThemeId?: string;
  defaultTaxIds?: readonly string[];
}>;

export type UpdateDocumentDefaultsInput = Readonly<{
  defaultDueRule?: string;
  defaultNotes?: string;
  defaultTerms?: string;
  defaultInvoiceThemeId?: string;
  defaultQuoteThemeId?: string;
  defaultTaxIds?: readonly string[];
}>;

export type BusinessSettings = Readonly<{
  businessId: string;
  bankTransferInstructions?: string;
  chequeInstructions?: string;
  invoicePrefix?: string;
  nextInvoiceNumber?: number;
  quotePrefix?: string;
  nextQuoteNumber?: number;
  accentColor?: string;
  style?: string;
}>;

export type UpdateBusinessSettingsInput = Readonly<{
  bankTransferInstructions?: string;
  chequeInstructions?: string;
  invoicePrefix?: string;
  nextInvoiceNumber?: number;
  quotePrefix?: string;
  nextQuoteNumber?: number;
  accentColor?: string;
  style?: string;
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
  phone?: string;
  taxNumber?: string;
  archivedAt?: string;
}>;

export type ClientPage = Readonly<{
  items: readonly Client[];
}>;

export type CreateClientInput = Readonly<{
  name?: string;
  company?: string;
  emails?: Readonly<{ address: string; isPrimary?: boolean }>[];
  phone?: string;
  taxNumber?: string;
}>;

export type UpdateClientInput = CreateClientInput;

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

export type CreateProductInput = Readonly<{
  type: 'product' | 'service';
  name: string;
  description?: string;
  defaultRate?: string;
  unit?: string;
}>;

export type UpdateProductInput = CreateProductInput;

export type Tax = Readonly<{
  id: string;
  businessId: string;
  name: string;
  rate: string;
  registrationNumber?: string;
  isDefault: boolean;
}>;

export type CreateTaxInput = Readonly<{
  name: string;
  rate: string;
  registrationNumber?: string;
  isDefault?: boolean;
}>;

export type UpdateTaxInput = CreateTaxInput;

export type InvoiceItem = Readonly<{
  description: string;
  secondaryDescription?: string;
  quantity: string;
  rate: string;
  appliedTaxes: Readonly<{ name: string; rate: string }>[];
}>;

export type InvoiceAddress = Readonly<{
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
}>;

export type InvoiceClientSnapshot = Readonly<{
  displayName: string;
  emails: readonly string[];
  phone?: string;
  address?: InvoiceAddress;
  taxNumber?: string;
}>;

export type InvoiceBusinessSnapshot = Readonly<{
  displayName: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: InvoiceAddress;
  taxNumbers?: readonly string[];
  logoAssetId?: string;
}>;

export type InvoiceDiscount = Readonly<{
  type: 'percentage' | 'fixed';
  value: string;
}>;

export type InvoiceDepositTerms = Readonly<{
  type: 'percentage' | 'fixed';
  value: string;
  dueRule: DepositDueRule;
  dueDate?: string;
}>;

export type Invoice = Readonly<{
  id: string;
  number: string;
  status: string;
  currencyCode: string;
  themeId?: string;
  themeVersionId?: string;
  themeNameSnapshot?: string;
  issueDate: string;
  dueDate?: string;
  poNumber?: string;
  clientId?: string;
  clientSnapshot: InvoiceClientSnapshot;
  businessSnapshot: InvoiceBusinessSnapshot;
  items: readonly InvoiceItem[];
  discount?: InvoiceDiscount;
  depositTerms?: InvoiceDepositTerms;
}>;

export type InvoicePage = Readonly<{
  items: readonly Invoice[];
}>;

export type CreateInvoiceItemInput = Readonly<{
  description: string;
  secondaryDescription?: string;
  quantity: string;
  rate: string;
  appliedTaxes?: Readonly<{ name: string; rate: string }>[];
  sourceProductServiceId?: string;
}>;

export type DepositDueRule = 'on_receipt' | 'days_7' | 'days_15' | 'custom';

export type CreateInvoiceDepositInput = Readonly<{
  type: 'percentage' | 'fixed';
  value: string;
  dueRule: DepositDueRule;
  dueDate?: string;
}>;

export type CreateInvoiceDiscountInput = Readonly<{
  type: 'percentage' | 'fixed';
  value: string;
}>;

export type CreateInvoiceInput = Readonly<{
  number?: string;
  clientId?: string;
  issueDate: string;
  dueDate?: string;
  currencyCode: string;
  poNumber?: string;
  themeId?: string;
  items: readonly CreateInvoiceItemInput[];
  depositTerms?: CreateInvoiceDepositInput;
  discount?: CreateInvoiceDiscountInput;
}>;

export type Quote = Readonly<{
  id: string;
  number: string;
  status: string;
  currencyCode: string;
  themeId?: string;
  themeVersionId?: string;
  themeNameSnapshot?: string;
  issueDate: string;
  validUntil?: string;
  clientSnapshot: InvoiceClientSnapshot;
  businessSnapshot: InvoiceBusinessSnapshot;
  items: readonly InvoiceItem[];
  proposedDepositTerms?: InvoiceDepositTerms;
  convertedInvoiceIds: readonly string[];
}>;

export type QuotePage = Readonly<{
  items: readonly Quote[];
}>;

export type CreateQuoteInput = Readonly<{
  number?: string;
  clientId?: string;
  issueDate: string;
  validUntil?: string;
  currencyCode: string;
  themeId?: string;
  items: readonly CreateInvoiceItemInput[];
  proposedDepositTerms?: CreateInvoiceDepositInput;
}>;

export type SendInvoiceInput = Readonly<{
  to: readonly string[];
  cc?: readonly string[];
  bcc?: readonly string[];
  subject: string;
  message?: string;
}>;

export type RecordPaymentInput = Readonly<{
  amount: string;
  paidAt: string;
  method?: string;
  reference?: string;
}>;

export type Payment = Readonly<{
  id: string;
  invoiceId: string;
  amount: string;
  paidAt: string;
  method?: string;
  reference?: string;
}>;

export type ActivityEvent = Readonly<{
  id: string;
  businessId: string;
  entityType: 'invoice' | 'quote';
  entityId: string;
  type:
    | 'created'
    | 'sent'
    | 'viewed'
    | 'accepted'
    | 'declined'
    | 'payment_recorded'
    | 'voided'
    | 'converted';
  occurredAt: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type DocumentTheme = Readonly<{
  id: string;
  businessId: string;
  name: string;
  appliesToInvoice: boolean;
  appliesToQuote: boolean;
  currentVersionId: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type DocumentThemeVersion = Readonly<{
  id: string;
  themeId: string;
  version: number;
  schemaVersion: number;
  config: Readonly<Record<string, unknown>>;
  createdAt: string;
  createdBy?: string;
}>;

export type ThemeDetail = Readonly<{
  theme: DocumentTheme;
  versions: readonly DocumentThemeVersion[];
}>;

export type CreateThemeInput = Readonly<{
  preset: string;
  name?: string;
  appliesToInvoice?: boolean;
  appliesToQuote?: boolean;
}>;

export type UpdateThemeInput = Readonly<{
  name?: string;
  appliesToInvoice?: boolean;
  appliesToQuote?: boolean;
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
    this.fetchImpl =
      options.fetchImpl ?? ((input, init) => fetch(input, init));
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

  async getBusiness(
    businessId: string,
    token: string,
  ): Promise<Business> {
    return this.request<Business>(`/businesses/${businessId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async updateBusiness(
    businessId: string,
    input: CreateBusinessInput,
    token: string,
  ): Promise<Business> {
    return this.request<Business>(`/businesses/${businessId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async getDocumentDefaults(
    businessId: string,
    token: string,
  ): Promise<DocumentDefaults> {
    return this.request<DocumentDefaults>(
      `/businesses/${businessId}/document-defaults`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  }

  async updateDocumentDefaults(
    businessId: string,
    input: UpdateDocumentDefaultsInput,
    token: string,
  ): Promise<DocumentDefaults> {
    return this.request<DocumentDefaults>(
      `/businesses/${businessId}/document-defaults`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async getBusinessSettings(
    businessId: string,
    token: string,
  ): Promise<BusinessSettings> {
    return this.request<BusinessSettings>(
      `/businesses/${businessId}/settings`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  }

  async updateBusinessSettings(
    businessId: string,
    input: UpdateBusinessSettingsInput,
    token: string,
  ): Promise<BusinessSettings> {
    return this.request<BusinessSettings>(
      `/businesses/${businessId}/settings`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { authorization: `Bearer ${token}` },
      },
    );
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

  async createClient(
    businessId: string,
    input: CreateClientInput,
    token: string,
  ): Promise<Client> {
    return this.request<Client>(`/businesses/${businessId}/clients`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async getClient(
    businessId: string,
    clientId: string,
    token: string,
  ): Promise<Client | null> {
    return this.request<Client | null>(
      `/businesses/${businessId}/clients/${clientId}`,
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async updateClient(
    businessId: string,
    clientId: string,
    input: UpdateClientInput,
    token: string,
  ): Promise<Client> {
    return this.request<Client>(
      `/businesses/${businessId}/clients/${clientId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async archiveClient(
    businessId: string,
    clientId: string,
    token: string,
  ): Promise<Client> {
    return this.request<Client>(
      `/businesses/${businessId}/clients/${clientId}/archive`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async restoreClient(
    businessId: string,
    clientId: string,
    token: string,
  ): Promise<Client> {
    return this.request<Client>(
      `/businesses/${businessId}/clients/${clientId}/restore`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
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

  async createProduct(
    businessId: string,
    input: CreateProductInput,
    token: string,
  ): Promise<ProductService> {
    return this.request<ProductService>(`/businesses/${businessId}/products`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async getProduct(
    businessId: string,
    productId: string,
    token: string,
  ): Promise<ProductService | null> {
    return this.request<ProductService | null>(
      `/businesses/${businessId}/products/${productId}`,
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async updateProduct(
    businessId: string,
    productId: string,
    input: UpdateProductInput,
    token: string,
  ): Promise<ProductService> {
    return this.request<ProductService>(
      `/businesses/${businessId}/products/${productId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async listTaxes(businessId: string, token: string): Promise<Tax[]> {
    return this.request<Tax[]>(`/businesses/${businessId}/taxes`, {
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async createTax(
    businessId: string,
    input: CreateTaxInput,
    token: string,
  ): Promise<Tax> {
    return this.request<Tax>(`/businesses/${businessId}/taxes`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async updateTax(
    businessId: string,
    taxId: string,
    input: UpdateTaxInput,
    token: string,
  ): Promise<Tax> {
    return this.request<Tax>(`/businesses/${businessId}/taxes/${taxId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async listQuotes(businessId: string, token: string): Promise<QuotePage> {
    return this.request<QuotePage>(`/businesses/${businessId}/quotes`, {
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async createQuote(
    businessId: string,
    input: CreateQuoteInput,
    token: string,
  ): Promise<Quote> {
    return this.request<Quote>(`/businesses/${businessId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async getQuote(
    businessId: string,
    quoteId: string,
    token: string,
  ): Promise<Quote> {
    return this.request<Quote>(
      `/businesses/${businessId}/quotes/${quoteId}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  }

  async sendQuote(
    businessId: string,
    quoteId: string,
    input: SendInvoiceInput,
    token: string,
  ): Promise<Quote> {
    return this.request<Quote>(
      `/businesses/${businessId}/quotes/${quoteId}/send`,
      {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async acceptQuote(
    businessId: string,
    quoteId: string,
    token: string,
  ): Promise<Quote> {
    return this.request<Quote>(
      `/businesses/${businessId}/quotes/${quoteId}/accept`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async declineQuote(
    businessId: string,
    quoteId: string,
    token: string,
  ): Promise<Quote> {
    return this.request<Quote>(
      `/businesses/${businessId}/quotes/${quoteId}/decline`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async convertQuote(
    businessId: string,
    quoteId: string,
    token: string,
  ): Promise<{ quote: Quote; invoice: Invoice }> {
    return this.request<{ quote: Quote; invoice: Invoice }>(
      `/businesses/${businessId}/quotes/${quoteId}/convert`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async listQuoteActivity(
    businessId: string,
    quoteId: string,
    token: string,
  ): Promise<ActivityEvent[]> {
    return this.request<ActivityEvent[]>(
      `/businesses/${businessId}/quotes/${quoteId}/activity`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  }

  async adoptLatestQuoteTheme(
    businessId: string,
    quoteId: string,
    token: string,
  ): Promise<Quote> {
    return this.request<Quote>(
      `/businesses/${businessId}/quotes/${quoteId}/adopt-latest-theme`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async listInvoices(
    businessId: string,
    token: string,
  ): Promise<InvoicePage> {
    return this.request<InvoicePage>(
      `/businesses/${businessId}/invoices`,
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async createInvoice(
    businessId: string,
    input: CreateInvoiceInput,
    token: string,
  ): Promise<Invoice> {
    return this.request<Invoice>(`/businesses/${businessId}/invoices`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async getInvoice(
    businessId: string,
    invoiceId: string,
    token: string,
  ): Promise<Invoice> {
    return this.request<Invoice>(
      `/businesses/${businessId}/invoices/${invoiceId}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  }

  async sendInvoice(
    businessId: string,
    invoiceId: string,
    input: SendInvoiceInput,
    token: string,
  ): Promise<Invoice> {
    return this.request<Invoice>(
      `/businesses/${businessId}/invoices/${invoiceId}/send`,
      {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async recordPayment(
    businessId: string,
    invoiceId: string,
    input: RecordPaymentInput,
    token: string,
  ): Promise<{ invoice: Invoice; paymentId: string }> {
    return this.request<{ invoice: Invoice; paymentId: string }>(
      `/businesses/${businessId}/invoices/${invoiceId}/payments`,
      {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async listPayments(
    businessId: string,
    invoiceId: string,
    token: string,
  ): Promise<Payment[]> {
    return this.request<Payment[]>(
      `/businesses/${businessId}/invoices/${invoiceId}/payments`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  }

  async listActivity(
    businessId: string,
    invoiceId: string,
    token: string,
  ): Promise<ActivityEvent[]> {
    return this.request<ActivityEvent[]>(
      `/businesses/${businessId}/invoices/${invoiceId}/activity`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  }

  async duplicateInvoice(
    businessId: string,
    invoiceId: string,
    token: string,
  ): Promise<Invoice> {
    return this.request<Invoice>(
      `/businesses/${businessId}/invoices/${invoiceId}/duplicate`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async voidInvoice(
    businessId: string,
    invoiceId: string,
    token: string,
  ): Promise<Invoice> {
    return this.request<Invoice>(
      `/businesses/${businessId}/invoices/${invoiceId}/void`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async deleteInvoice(
    businessId: string,
    invoiceId: string,
    token: string,
  ): Promise<void> {
    await this.request<unknown>(
      `/businesses/${businessId}/invoices/${invoiceId}`,
      { method: 'DELETE', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async adoptLatestInvoiceTheme(
    businessId: string,
    invoiceId: string,
    token: string,
  ): Promise<Invoice> {
    return this.request<Invoice>(
      `/businesses/${businessId}/invoices/${invoiceId}/adopt-latest-theme`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async listThemes(
    businessId: string,
    token: string,
    includeArchived = false,
  ): Promise<DocumentTheme[]> {
    const query = includeArchived ? '?includeArchived=true' : '';
    return this.request<DocumentTheme[]>(
      `/businesses/${businessId}/themes${query}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  }

  async createTheme(
    businessId: string,
    input: CreateThemeInput,
    token: string,
  ): Promise<DocumentTheme> {
    return this.request<DocumentTheme>(`/businesses/${businessId}/themes`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { authorization: `Bearer ${token}` },
    });
  }

  async getTheme(
    businessId: string,
    themeId: string,
    token: string,
  ): Promise<ThemeDetail> {
    return this.request<ThemeDetail>(
      `/businesses/${businessId}/themes/${themeId}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  }

  async updateTheme(
    businessId: string,
    themeId: string,
    input: UpdateThemeInput,
    token: string,
  ): Promise<DocumentTheme> {
    return this.request<DocumentTheme>(
      `/businesses/${businessId}/themes/${themeId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async duplicateTheme(
    businessId: string,
    themeId: string,
    token: string,
  ): Promise<DocumentTheme> {
    return this.request<DocumentTheme>(
      `/businesses/${businessId}/themes/${themeId}/duplicate`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async archiveTheme(
    businessId: string,
    themeId: string,
    token: string,
  ): Promise<DocumentTheme> {
    return this.request<DocumentTheme>(
      `/businesses/${businessId}/themes/${themeId}/archive`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async setDefaultTheme(
    businessId: string,
    themeId: string,
    kind: 'invoice' | 'quote',
    token: string,
  ): Promise<DocumentTheme> {
    return this.request<DocumentTheme>(
      `/businesses/${businessId}/themes/${themeId}/set-default`,
      {
        method: 'POST',
        body: JSON.stringify({ kind }),
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async restoreTheme(
    businessId: string,
    themeId: string,
    token: string,
  ): Promise<DocumentTheme> {
    return this.request<DocumentTheme>(
      `/businesses/${businessId}/themes/${themeId}/restore`,
      { method: 'POST', headers: { authorization: `Bearer ${token}` } },
    );
  }

  async saveThemeConfig(
    businessId: string,
    themeId: string,
    config: Readonly<Record<string, unknown>>,
    token: string,
  ): Promise<ThemeDetail> {
    return this.request<ThemeDetail>(
      `/businesses/${businessId}/themes/${themeId}/versions`,
      {
        method: 'POST',
        body: JSON.stringify(config),
        headers: { authorization: `Bearer ${token}` },
      },
    );
  }

  async getThemeHistoricalVersion(
    businessId: string,
    themeId: string,
    versionId: string,
    token: string,
  ): Promise<DocumentThemeVersion> {
    return this.request<DocumentThemeVersion>(
      `/businesses/${businessId}/themes/${themeId}/versions/${versionId}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  }

  async getThemeVersionState(
    businessId: string,
    themeId: string,
    frozenVersionId: string,
    token: string,
  ): Promise<{
    themeId: string;
    themeVersionId?: string;
    newerVersionAvailable: boolean;
  }> {
    return this.request<{
      themeId: string;
      themeVersionId?: string;
      newerVersionAvailable: boolean;
    }>(
      `/businesses/${businessId}/themes/${themeId}/version-state/${frozenVersionId}`,
      { headers: { authorization: `Bearer ${token}` } },
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
