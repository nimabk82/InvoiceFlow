import { describe, expect, it } from 'vitest';
import { normalizeDocumentForRendering } from '@invoiceflow/document-schema';
import { themePresets } from '@invoiceflow/theme-schema';

import { renderItemTable } from '../src/index.js';

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
      secondaryDescription: 'Week 1',
      quantity: '2',
      rate: '500',
      appliedTaxes: [],
    },
    {
      description: 'Design',
      quantity: '1',
      rate: '1000',
      appliedTaxes: [],
    },
  ],
};

describe('renderItemTable', () => {
  it('always shows description and amount columns, amount last', () => {
    const document = normalizeDocumentForRendering(base);
    const table = renderItemTable(document, themePresets.clean);

    const keys = table.columns.map((c) => c.key);
    expect(keys[0]).toBe('description');
    expect(keys[keys.length - 1]).toBe('amount');
  });

  it('omits qty/rate columns when the theme hides them', () => {
    const document = normalizeDocumentForRendering(base);
    const theme = {
      ...themePresets.clean,
      items: { ...themePresets.clean.items, showQuantity: false, showRate: false },
    };
    const table = renderItemTable(document, theme);

    expect(table.columns.map((c) => c.key)).toEqual(['description', 'amount']);
  });

  it('renders one row per item with aligned cells', () => {
    const document = normalizeDocumentForRendering(base);
    const table = renderItemTable(document, themePresets.clean);

    expect(table.rows).toHaveLength(2);
    expect(table.rows[0].cells[0].value).toContain('Consulting');
    expect(table.rows[0].cells[0].align).toBe('left');
    const amountCell = table.rows[0].cells[table.columns.length - 1];
    expect(amountCell.columnKey).toBe('amount');
    expect(amountCell.align).toBe('right');
  });
});
