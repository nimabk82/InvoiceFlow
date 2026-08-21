import type { RenderableDocument } from '@invoiceflow/document-schema';
import type {
  BillToStyle,
  DepositStyle,
  HeaderLayout,
  ItemHeaderStyle,
  ItemRowStyle,
  SectionId,
  ThemeConfig,
  TotalsEmphasis,
  TotalsLayout,
} from '@invoiceflow/theme-schema';

import { buildTotalsRows, type RenderedTotalsRow } from './totals-renderer.js';

export type RenderOutput = 'preview' | 'client_view' | 'print' | 'pdf';

export type RenderContext = Readonly<{
  output: RenderOutput;
  locale: string;
  timezone: string;
}>;

export type RenderedItemRow = Readonly<{
  description: string;
  secondaryDescription?: string;
  quantity: string;
  rate: string;
  amount: string;
}>;

export type RenderedSection =
  | Readonly<{ key: 'header'; layout: HeaderLayout; businessName: string; legalName?: string }>
  | Readonly<{
      key: 'business';
      displayName: string;
      legalName?: string;
      email?: string;
      phone?: string;
      website?: string;
    }>
  | Readonly<{
      key: 'document-info';
      number: string;
      issueDate: string;
      dueDate?: string;
      validUntil?: string;
      poNumber?: string;
    }>
  | Readonly<{
      key: 'bill-to';
      style: BillToStyle;
      displayName: string;
      emails: readonly string[];
      phone?: string;
      address?: string;
      taxNumber?: string;
    }>
  | Readonly<{
      key: 'items';
      rows: readonly RenderedItemRow[];
      headerStyle: ItemHeaderStyle;
      rowStyle: ItemRowStyle;
      showQuantity: boolean;
      showRate: boolean;
      showTax: boolean;
    }>
  | Readonly<{
      key: 'totals';
      rows: readonly RenderedTotalsRow[];
      layout: TotalsLayout;
      emphasis: TotalsEmphasis;
      currencyCode: string;
    }>
  | Readonly<{ key: 'deposit'; style: DepositStyle; required: string; remaining: string }>
  | Readonly<{ key: 'payment'; content: string }>
  | Readonly<{ key: 'notes'; content: string }>
  | Readonly<{ key: 'terms'; content: string }>
  | Readonly<{
      key: 'footer';
      alignment: ThemeConfig['footer']['alignment'];
      showBusinessName: boolean;
      showWebsite: boolean;
      showPageNumber: boolean;
      customText?: string;
      showDivider: boolean;
    }>;

export type RenderedDocument = Readonly<{
  currencyCode: string;
  sections: readonly RenderedSection[];
}>;

export type RenderDocumentInput = Readonly<{
  document: RenderableDocument;
  theme: ThemeConfig;
  renderContext: RenderContext;
}>;

const canonicalOrder: readonly SectionId[] = [
  'header',
  'business',
  'document-info',
  'bill-to',
  'items',
  'totals',
  'deposit',
  'payment',
  'notes',
  'terms',
  'footer',
];

export function renderDocumentSections(
  input: RenderDocumentInput,
): RenderedDocument {
  const { document, theme } = input;
  const sections: RenderedSection[] = [];

  for (const id of canonicalOrder) {
    const section = buildSection(id, document, theme);
    if (section) {
      sections.push(section);
    }
  }

  return { currencyCode: document.currencyCode, sections };
}

function buildSection(
  id: SectionId,
  document: RenderableDocument,
  theme: ThemeConfig,
): RenderedSection | undefined {
  const enabled = sectionEnabled(theme);

  switch (id) {
    case 'header':
      return enabled('header')
        ? {
            key: 'header',
            layout: theme.header.layout,
            businessName: document.business.displayName,
            legalName: document.business.legalName,
          }
        : undefined;
    case 'business':
      return enabled('business')
        ? {
            key: 'business',
            displayName: document.business.displayName,
            legalName: document.business.legalName,
            email: document.business.email,
            phone: document.business.phone,
            website: document.business.website,
          }
        : undefined;
    case 'document-info':
      return enabled('document-info')
        ? {
            key: 'document-info',
            number: document.number,
            issueDate: document.issueDate,
            dueDate: document.dueDate,
            validUntil: document.validUntil,
            poNumber: document.poNumber,
          }
        : undefined;
    case 'bill-to':
      return enabled('bill-to')
        ? {
            key: 'bill-to',
            style: theme.billTo.style,
            displayName: document.client.displayName,
            emails: document.client.emails,
            phone: document.client.phone,
            address: renderAddress(document.client.address),
            taxNumber: document.client.taxNumber,
          }
        : undefined;
    case 'items':
      return {
        key: 'items',
        rows: document.items.map((item) => ({
          description: item.description,
          secondaryDescription: item.secondaryDescription,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        headerStyle: theme.items.headerStyle,
        rowStyle: theme.items.rowStyle,
        showQuantity: theme.items.showQuantity,
        showRate: theme.items.showRate,
        showTax: theme.items.showTax,
      };
    case 'totals':
      return {
        key: 'totals',
        rows: buildTotalsRows(document),
        layout: theme.totals.layout,
        emphasis: theme.totals.emphasis,
        currencyCode: document.currencyCode,
      };
    case 'deposit':
      return document.deposit
        ? {
            key: 'deposit',
            style: theme.deposit.style,
            required: document.deposit.required,
            remaining: document.deposit.remaining,
          }
        : undefined;
    case 'payment':
      return undefined;
    case 'notes':
      return enabled('notes') && document.notes
        ? { key: 'notes', content: richTextToText(document.notes) }
        : undefined;
    case 'terms':
      return enabled('terms') && document.terms
        ? { key: 'terms', content: richTextToText(document.terms) }
        : undefined;
    case 'footer':
      return enabled('footer')
        ? {
            key: 'footer',
            alignment: theme.footer.alignment,
            showBusinessName: theme.footer.showBusinessName,
            showWebsite: theme.footer.showWebsite,
            showPageNumber: theme.footer.showPageNumber,
            customText: theme.footer.customText,
            showDivider: theme.footer.showDivider,
          }
        : undefined;
  }
}

function sectionEnabled(theme: ThemeConfig) {
  const map = new Map<SectionId, boolean>();
  for (const section of theme.sections) {
    map.set(section.id, section.enabled);
  }
  return (id: SectionId): boolean => map.get(id) ?? true;
}

function renderAddress(
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    countryCode?: string;
  },
): string | undefined {
  if (!address) {
    return undefined;
  }
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.region].filter(Boolean).join(', '),
    [address.postalCode, address.countryCode].filter(Boolean).join(' '),
  ].filter((part) => part && part.trim() !== '');
  return parts.length > 0 ? parts.join('\n') : undefined;
}

function richTextToText(rich: { content: readonly unknown[] }): string {
  const texts: string[] = [];
  for (const node of rich.content) {
    if (isBlock(node) && typeof node.text === 'string') {
      texts.push(node.text);
    }
  }
  return texts.join('\n');
}

function isBlock(node: unknown): node is Record<string, unknown> {
  return typeof node === 'object' && node !== null;
}
