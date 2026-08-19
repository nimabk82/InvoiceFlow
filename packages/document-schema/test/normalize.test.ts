import { describe, expect, it } from 'vitest';

import { normalizeDocumentForRendering } from '../src/index.js';

const business = {
  displayName: 'Acme Inc',
  legalName: 'Acme Inc.',
  emails: [],
  taxNumbers: [],
};

const client = {
  displayName: 'Client Co',
  emails: ['client@example.com'],
};

const base = {
  kind: 'invoice',
  currencyCode: 'USD',
  themeVersionId: 'theme-version-1',
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
};

describe('normalizeDocumentForRendering', () => {
  it('computes subtotal, tax, and total', () => {
    const document = normalizeDocumentForRendering(base);

    expect(document.subtotal).toBe('5000.00');
    expect(document.taxTotal).toBe('650.00');
    expect(document.total).toBe('5650.00');
    expect(document.items[0].amount).toBe('5000.00');
  });

  it('includes a deposit with required and remaining amounts', () => {
    const document = normalizeDocumentForRendering({
      ...base,
      depositTerms: { type: 'percentage', value: '30' },
    });

    expect(document.deposit).toEqual({
      type: 'percentage',
      value: '30',
      required: '1695.00',
      remaining: '3955.00',
    });
  });

  it('applies a discount before tax', () => {
    const document = normalizeDocumentForRendering({
      ...base,
      items: [
        {
          description: 'Item',
          quantity: '2',
          rate: '100',
          appliedTaxes: [{ name: 'GST', rate: '10' }],
        },
      ],
      discount: { type: 'percentage', value: '10' },
    });

    expect(document.discount).toEqual({
      type: 'percentage',
      value: '10',
      amount: '20.00',
    });
    expect(document.subtotal).toBe('200.00');
    expect(document.total).toBe('198.00');
  });

  it('preserves quote-only fields', () => {
    const document = normalizeDocumentForRendering({
      ...base,
      kind: 'quote',
      validUntil: '2026-09-30',
      depositTerms: { type: 'fixed', value: '100' },
    });

    expect(document.kind).toBe('quote');
    expect(document.validUntil).toBe('2026-09-30');
    expect(document.deposit?.required).toBe('100.00');
  });
});
