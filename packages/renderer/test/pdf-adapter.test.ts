import { describe, expect, it } from 'vitest';
import { normalizeDocumentForRendering } from '@invoiceflow/document-schema';
import { themePresets } from '@invoiceflow/theme-schema';

import { renderForPdf } from '../src/index.js';

const business = { displayName: 'Acme Inc', email: 'b@acme.com', taxNumbers: [] };
const client = { displayName: 'Client Co', emails: ['c@example.com'] };

function pdfInvoice(itemCount: number) {
  const document = normalizeDocumentForRendering({
    kind: 'invoice' as const,
    currencyCode: 'CAD',
    themeVersionId: 'tv-1',
    business,
    client,
    number: 'INV-001',
    issueDate: '2026-08-01',
    items: Array.from({ length: itemCount }, (_, i) => ({
      description: `Item ${i}`,
      quantity: '1',
      rate: '10',
      appliedTaxes: [],
    })),
  });
  return renderForPdf({
    document,
    theme: themePresets.clean,
    renderContext: { output: 'pdf', locale: 'en-CA', timezone: 'UTC' },
  });
}

describe('renderForPdf', () => {
  it('reuses the print HTML for the document body', () => {
    const result = pdfInvoice(3);
    expect(result.html.startsWith('<!doctype html>')).toBe(true);
    expect(result.html).toContain('@page');
  });

  it('reports letter dimensions in points with the theme margin', () => {
    const result = pdfInvoice(3);
    expect(result.pdf.pageSize).toBe('letter');
    expect(result.pdf.page.widthPoints).toBeCloseTo(612, 0);
    expect(result.pdf.page.heightPoints).toBeCloseTo(792, 0);
    expect(result.pdf.page.marginPoints).toBeCloseTo(54, 0);
  });

  it('reports the correct page count across a multi-page document', () => {
    const result = pdfInvoice(40);
    expect(result.pages.length).toBeGreaterThan(1);
    expect(result.pdf.pageCount).toBe(result.pages.length);
  });

  it('reports A4 dimensions for the minimal preset', () => {
    const document = normalizeDocumentForRendering({
      kind: 'invoice' as const,
      currencyCode: 'CAD',
      themeVersionId: 'tv-1',
      business,
      client,
      number: 'INV-001',
      issueDate: '2026-08-01',
      items: [],
    });
    const result = renderForPdf({
      document,
      theme: themePresets.minimal,
      renderContext: { output: 'pdf', locale: 'en-CA', timezone: 'UTC' },
    });
    expect(result.pdf.pageSize).toBe('a4');
    expect(result.pdf.page.widthPoints).toBeCloseTo(595, 0);
    expect(result.pdf.page.marginPoints).toBeCloseTo(36, 0);
  });

  it('carries diagnostics through to the pdf result', () => {
    const document = normalizeDocumentForRendering({
      kind: 'invoice' as const,
      currencyCode: 'CAD',
      themeVersionId: 'tv-1',
      business,
      client,
      number: 'INV-001',
      issueDate: '2026-08-01',
      items: [],
    });
    const theme = {
      ...themePresets.clean,
      brand: { ...themePresets.clean.brand, primaryColor: '#eeeeee' },
    };
    const result = renderForPdf({
      document,
      theme,
      renderContext: { output: 'pdf', locale: 'en-CA', timezone: 'UTC' },
    });
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});