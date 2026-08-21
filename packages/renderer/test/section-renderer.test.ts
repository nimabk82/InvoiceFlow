import { describe, expect, it } from 'vitest';
import { normalizeDocumentForRendering } from '@invoiceflow/document-schema';
import { themePresets } from '@invoiceflow/theme-schema';

import { renderDocumentSections } from '../src/index.js';

const business = {
  displayName: 'Acme Inc',
  legalName: 'Acme Inc.',
  email: 'billing@acme.com',
  taxNumbers: [],
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

const baseInput = {
  kind: 'invoice' as const,
  currencyCode: 'CAD',
  themeVersionId: 'tv-1',
  business,
  client,
  number: 'INV-001',
  issueDate: '2026-08-01',
  dueDate: '2026-08-31',
  items: [
    {
      description: 'Consulting',
      quantity: '1',
      rate: '5000',
      appliedTaxes: [{ name: 'GST', rate: '13' }],
    },
  ],
  depositTerms: { type: 'percentage' as const, value: '30' },
};

const renderContext = { output: 'preview' as const, locale: 'en-CA', timezone: 'UTC' };

describe('renderDocumentSections', () => {
  it('renders sections in protected order with totals and deposit', () => {
    const document = normalizeDocumentForRendering(baseInput);
    const rendered = renderDocumentSections({
      document,
      theme: themePresets.clean,
      renderContext,
    });

    const keys = rendered.sections.map((section) => section.key);
    const itemsIndex = keys.indexOf('items');
    const totalsIndex = keys.indexOf('totals');
    const depositIndex = keys.indexOf('deposit');

    expect(itemsIndex).toBeGreaterThan(-1);
    expect(totalsIndex).toBeGreaterThan(itemsIndex);
    expect(depositIndex).toBeGreaterThan(totalsIndex);
    expect(keys[keys.length - 1]).toBe('footer');

    const totals = rendered.sections.find((s) => s.key === 'totals');
    expect(totals?.key).toBe('totals');
  });

  it('honors theme presentation flags for items', () => {
    const document = normalizeDocumentForRendering(baseInput);
    const rendered = renderDocumentSections({
      document,
      theme: { ...themePresets.clean, items: { ...themePresets.clean.items, showQuantity: false, showRate: false } },
      renderContext,
    });

    const items = rendered.sections.find((s) => s.key === 'items');
    expect(items?.key).toBe('items');
    if (items?.key === 'items') {
      expect(items.showQuantity).toBe(false);
      expect(items.showRate).toBe(false);
      expect(items.showTax).toBe(themePresets.clean.items.showTax);
    }
  });

  it('does not render a deposit section when the document has no deposit', () => {
    const document = normalizeDocumentForRendering({ ...baseInput, depositTerms: undefined });
    const rendered = renderDocumentSections({
      document,
      theme: themePresets.clean,
      renderContext,
    });

    expect(rendered.sections.some((s) => s.key === 'deposit')).toBe(false);
  });
});
