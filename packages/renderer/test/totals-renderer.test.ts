import { describe, expect, it } from 'vitest';
import { normalizeDocumentForRendering } from '@invoiceflow/document-schema';
import { themePresets } from '@invoiceflow/theme-schema';

import { renderTotalsAndDeposit } from '../src/index.js';

const business = { displayName: 'Acme Inc', email: 'b@acme.com', taxNumbers: [] };
const client = { displayName: 'Client Co', emails: ['c@example.com'] };

const base = {
  kind: 'invoice' as const,
  currencyCode: 'CAD',
  themeVersionId: 'tv-1',
  business,
  client,
  number: 'INV-001',
  issueDate: '2026-08-01',
  items: [
    {
      description: 'Consulting',
      quantity: '1',
      rate: '5000',
      appliedTaxes: [{ name: 'GST', rate: '13' }],
    },
  ],
  discount: { type: 'percentage' as const, value: '10' },
  depositTerms: { type: 'percentage' as const, value: '30' },
};

describe('renderTotalsAndDeposit', () => {
  it('builds totals rows in order with a final emphasized total', () => {
    const document = normalizeDocumentForRendering(base);
    const { totals } = renderTotalsAndDeposit(document, themePresets.clean);

    const labels = totals.rows.map((r) => r.label);
    expect(labels[0]).toBe('Subtotal');
    expect(labels[labels.length - 1]).toBe('Total');
    expect(totals.rows[labels.length - 1].emphasis).toBe(true);
  });

  it('carries theme layout/emphasis and currency', () => {
    const document = normalizeDocumentForRendering(base);
    const { totals } = renderTotalsAndDeposit(document, themePresets.clean);

    expect(totals.layout).toBe(themePresets.clean.totals.layout);
    expect(totals.emphasis).toBe(themePresets.clean.totals.emphasis);
    expect(totals.currencyCode).toBe('CAD');
  });

  it('includes a deposit block when the document has deposit terms', () => {
    const document = normalizeDocumentForRendering(base);
    const { deposit } = renderTotalsAndDeposit(document, themePresets.clean);

    expect(deposit).toBeDefined();
    expect(deposit?.style).toBe(themePresets.clean.deposit.style);
  });

  it('omits the deposit block when there is no deposit', () => {
    const document = normalizeDocumentForRendering({ ...base, depositTerms: undefined });
    const { deposit } = renderTotalsAndDeposit(document, themePresets.clean);

    expect(deposit).toBeUndefined();
  });
});
