export type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
};

export type Business = {
  id: string;
  ownerAccountId: string;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
  countryCode: string;
  currencyCode: string;
  logoAssetId?: string;
  defaultInvoiceThemeId?: string;
  defaultQuoteThemeId?: string;
};

export type DocumentDefaults = {
  businessId: string;
  defaultDueRule?: string;
  defaultNotes?: string;
  defaultTerms?: string;
  defaultInvoiceThemeId?: string;
  defaultQuoteThemeId?: string;
  defaultTaxIds?: string[];
};

export type BusinessSettings = {
  businessId: string;
  bankTransferInstructions?: string;
  chequeInstructions?: string;
  invoicePrefix?: string;
  nextInvoiceNumber?: number;
  quotePrefix?: string;
  nextQuoteNumber?: number;
  accentColor?: string;
  style?: string;
};

export type BusinessSnapshot = {
  displayName: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
  taxNumbers?: string[];
  logoAssetId?: string;
};