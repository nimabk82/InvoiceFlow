export type RenderableDocumentKind = 'invoice' | 'quote';

export type RenderableAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
};

export type RenderableBusiness = {
  displayName: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: RenderableAddress;
  taxNumbers?: string[];
  logoAssetId?: string;
};

export type RenderableClient = {
  displayName: string;
  emails: string[];
  phone?: string;
  address?: RenderableAddress;
  taxNumber?: string;
};

export type RenderableItem = {
  description: string;
  secondaryDescription?: string;
  quantity: string;
  rate: string;
  amount: string;
};

export type RenderableTaxComponent = {
  name: string;
  rate: string;
  amount: string;
};

export type RenderableDiscount =
  | { type: 'percentage'; value: string; amount: string }
  | { type: 'fixed'; value: string; amount: string };

export type RenderableDeposit = {
  type: 'percentage' | 'fixed';
  value: string;
  required: string;
  remaining: string;
};

export type RenderableRichText = {
  type: 'doc';
  content: readonly unknown[];
};

export type RenderableDocument = {
  kind: RenderableDocumentKind;
  currencyCode: string;
  themeVersionId: string;
  business: RenderableBusiness;
  client: RenderableClient;
  number: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  poNumber?: string;
  items: RenderableItem[];
  discount?: RenderableDiscount;
  subtotal: string;
  taxComponents: RenderableTaxComponent[];
  taxTotal: string;
  total: string;
  deposit?: RenderableDeposit;
  notes?: RenderableRichText;
  terms?: RenderableRichText;
};
