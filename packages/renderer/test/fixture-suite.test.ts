import { describe, expect, it } from 'vitest';
import { normalizeDocumentForRendering } from '@invoiceflow/document-schema';
import { themePresets } from '@invoiceflow/theme-schema';
import type { ThemeConfig } from '@invoiceflow/theme-schema';

import {
  paginateDocument,
  renderDocumentSections,
  renderForPrint,
  renderForPdf,
} from '../src/index.js';

const business = {
  displayName: 'Acme Inc',
  legalName: 'Acme Inc.',
  email: 'billing@acme.com',
  phone: '555-0100',
  website: 'acme.com',
  address: {
    line1: '123 Main St',
    city: 'Toronto',
    region: 'ON',
    postalCode: 'M5V 2T6',
    countryCode: 'CA',
  },
  taxNumbers: ['RT0001'],
};

const longBusiness = {
  displayName: 'The Long-Named Consulting Group of North America, Ltd.',
  legalName: 'The Long-Named Consulting Group of North America, Limited.',
  email: 'accounts.payable@long-named-consulting-group-of-north-america.example',
  phone: '555-0100 x1234',
  website: 'www.long-named-consulting-group-of-north-america.example',
  address: {
    line1: '12345678 Very Long Street Name, Suite 900',
    city: 'North York',
    region: 'Ontario',
    postalCode: 'M5V 2T6',
    countryCode: 'CA',
  },
  taxNumbers: ['RT0001', 'GST123456789'],
};

const client = {
  displayName: 'Client Co',
  emails: ['client@example.com'],
  address: {
    line1: '123 Main St',
    city: 'Toronto',
    region: 'ON',
    postalCode: 'M5V 2T6',
    countryCode: 'CA',
  },
};

const longClient = {
  displayName: 'The Extremely Long-Named Client Corporation of Greater Toronto Area',
  emails: [
    'accounts@extremely-long-named-client-corp.example',
    'billing@extremely-long-named-client-corp.example',
  ],
  phone: '555-9999',
  address: {
    line1: '987654321 Bloor Street West, Unit 1200',
    line2: 'North Tower, Floor 12',
    city: 'Mississauga',
    region: 'Ontario',
    postalCode: 'L5B 4C3',
    countryCode: 'CA',
  },
  taxNumber: 'HST8888888',
};

const baseItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    description: `Professional service — ${i + 1}`,
    secondaryDescription:
      i % 3 === 0 ? 'Detailed secondary description for this row' : undefined,
    quantity: '1',
    rate: String(150 + i * 10),
    appliedTaxes: [{ name: 'HST', rate: '13' }],
  }));

type FixtureName =
  | 'standard-invoice'
  | 'deposit-invoice'
  | 'long-client'
  | 'long-items'
  | 'multi-page-invoice'
  | 'quote';

type Fixture = {
  name: FixtureName;
  kind: 'invoice' | 'quote';
  business: typeof business;
  client: typeof client;
  items: ReturnType<typeof baseItems>;
  notes?: { type: 'doc'; content: readonly unknown[] };
  deposit?: { type: 'percentage' | 'fixed'; value: string };
};

const fixtures: readonly Fixture[] = [
  {
    name: 'standard-invoice',
    kind: 'invoice',
    business,
    client,
    items: baseItems(3)
  },
  {
    name: 'deposit-invoice',
    kind: 'invoice',
    business,
    client,
    items: baseItems(4),
    deposit: { type: 'percentage', value: '30' }
  },
  {
    name: 'long-client',
    kind: 'invoice',
    business,
    client: longClient,
    items: baseItems(3)
  },
  {
    name: 'long-items',
    kind: 'invoice',
    business: longBusiness,
    client,
    items: baseItems(8).map((item, i) => ({
      ...item,
      description: `A very long line item description that wraps over multiple lines to stress row height estimation ${i + 1}`,
      secondaryDescription: 'Another long secondary description on a second line.',
    }))
  },
  {
    name: 'multi-page-invoice',
    kind: 'invoice',
    business,
    client,
    items: baseItems(45),
    notes: {
      type: 'doc',
      content: [{ type: 'paragraph', text: 'Thank you.\nPayment due in 30 days.' }],
    }
  },
  {
    name: 'quote',
    kind: 'quote',
    business,
    client,
    items: baseItems(3),
    deposit: { type: 'percentage', value: '30' }
  },
];

const themes: readonly { name: string; theme: ThemeConfig }[] = [
  { name: 'clean', theme: themePresets.clean },
  { name: 'modern', theme: themePresets.modern },
  { name: 'minimal', theme: themePresets.minimal },
];

function renderFixture(fixture: Fixture, theme: ThemeConfig) {
  const input = {
    kind: fixture.kind as const,
    currencyCode: 'CAD',
    themeVersionId: 'tv-1',
    business: fixture.business,
    client: fixture.client,
    number: fixture.kind === 'invoice' ? 'INV-001' : 'Q-001',
    issueDate: '2026-08-01',
    dueDate: fixture.kind === 'invoice' ? '2026-08-31' : undefined,
    validUntil: fixture.kind === 'quote' ? '2026-09-01' : undefined,
    items: fixture.items,
    depositTerms: fixture.deposit,
    notes: fixture.notes,
  };
  const document = normalizeDocumentForRendering(input);
  const ctx = { output: 'preview' as const, locale: 'en-CA', timezone: 'UTC' };
  const sections = renderDocumentSections({ document, theme, renderContext: ctx }).sections;
  const paginated = paginateDocument({ document, theme, renderContext: ctx });
  const print = renderForPrint({
    document,
    theme,
    renderContext: { output: 'print', locale: 'en-CA', timezone: 'UTC' },
  });
  const pdf = renderForPdf({
    document,
    theme,
    renderContext: { output: 'pdf', locale: 'en-CA', timezone: 'UTC' },
  });
  return { document, sections, paginated, print, pdf };
}

describe('renderer fixture suite (3 themes × 6 fixtures = 18 cases)', () => {
  for (const fixture of fixtures) {
    for (const { name, theme } of themes) {
      it(`${fixture.name} × ${name} renders the full pipeline cleanly`, () => {
        const result = renderFixture(fixture, theme);

        expect(result.sections.length).toBeGreaterThan(0);
        expect(result.paginated.pages.length).toBeGreaterThan(0);
        expect(result.paginated.pages.length).toBeGreaterThanOrEqual(1);
        if (fixture.name === 'multi-page-invoice') {
          expect(result.paginated.pages.length).toBeGreaterThan(1);
        }

        const totalBlocks = result.paginated.pages.reduce(
          (sum, page) => sum + page.blocks.length,
          0,
        );
        expect(totalBlocks).toBeGreaterThan(0);

        expect(result.print.html).toContain('<!doctype html>');
        expect(result.pdf.pdf.pageCount).toBe(result.paginated.pages.length);

        const blocks = result.paginated.pages.flatMap((page) => page.blocks);
        const itemRows = blocks.filter((block) => block.kind === 'item-row');
        expect(itemRows.length).toBe(fixture.items.length);

        const keys = result.sections.map((section) => section.key);
        const itemsIdx = keys.indexOf('items');
        const totalsIdx = keys.indexOf('totals');
        expect(itemsIdx).toBeGreaterThan(-1);
        expect(totalsIdx).toBeGreaterThan(itemsIdx);
        expect(keys[keys.length - 1]).toBe('footer');
      });
    }
  }
});