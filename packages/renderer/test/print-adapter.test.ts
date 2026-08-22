import { describe, expect, it } from 'vitest';
import { normalizeDocumentForRendering } from '@invoiceflow/document-schema';
import { themePresets } from '@invoiceflow/theme-schema';

import { renderForPrint } from '../src/index.js';

const business = { displayName: 'Acme Inc', email: 'b@acme.com', taxNumbers: [] };
const client = { displayName: 'Client Co', emails: ['c@example.com'] };

function printInvoice(itemCount: number) {
  const document = normalizeDocumentForRendering({
    kind: 'invoice' as const,
    currencyCode: 'CAD',
    themeVersionId: 'tv-1',
    business,
    client,
    number: 'INV-001',
    issueDate: '2026-08-01',
    dueDate: '2026-08-31',
    items: Array.from({ length: itemCount }, (_, i) => ({
      description: `Item ${i}`,
      quantity: '1',
      rate: '10',
      appliedTaxes: [],
    })),
  });
  return renderForPrint({
    document,
    theme: themePresets.clean,
    renderContext: { output: 'print', locale: 'en-CA', timezone: 'UTC' },
  });
}

describe('renderForPrint', () => {
  it('produces a self-contained HTML document with @page rules from the theme', () => {
    const result = printInvoice(3);
    expect(result.html.startsWith('<!doctype html>')).toBe(true);
    expect(result.html).toContain('@page');
    expect(result.html).toContain('size: 8.5in 11in');
    expect(result.html).toContain('margin: 0.75in');
    expect(result.html).toContain('</html>');
  });

  it('renders one print page per paginated page', () => {
    const result = printInvoice(40);
    const pageMatches = result.html.match(/class="if-print-page"/g) ?? [];
    expect(result.pages.length).toBeGreaterThan(1);
    expect(pageMatches).toHaveLength(result.pages.length);
  });

  it('adds page-break-after between pages but not after the last', () => {
    const result = printInvoice(40);
    expect(result.html).toContain('.if-print-page {\n    page-break-after: always');
    expect(result.html).toContain('.if-print-page:last-child { page-break-after: auto');
  });

  it('renders the continuation strip and numbered footer on continuation pages', () => {
    const result = printInvoice(40);
    expect(result.pages.length).toBeGreaterThan(1);

    for (const page of result.pages.slice(1)) {
      const pageIndex = page.pageNumber - 1;
      const sections = result.html.split('<section class="if-print-page">');
      const pageHtml = sections[pageIndex + 1] ?? '';

      if (page.continuationHeader) {
        expect(pageHtml).toContain('· continued');
        expect(pageHtml).toContain(page.continuationHeader.businessName);
      }
      if (page.footer) {
        expect(pageHtml).toContain(`Page ${page.pageNumber}`);
      }
    }
  });

  it('keeps diagnostics empty for a clean preset document', () => {
    const result = printInvoice(5);
    expect(result.diagnostics).toEqual([]);
    expect(result.html).not.toContain('Render diagnostics');
  });

  it('includes diagnostics in the print output when present', () => {
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
      typography: { ...themePresets.clean.typography, font: 'Comic Sans' },
    };
    const result = renderForPrint({
      document,
      theme,
      renderContext: { output: 'print', locale: 'en-CA', timezone: 'UTC' },
    });
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.html).toContain('Render diagnostics');
  });

  it('escapes HTML in item descriptions and business name', () => {
    const document = normalizeDocumentForRendering({
      kind: 'invoice' as const,
      currencyCode: 'CAD',
      themeVersionId: 'tv-1',
      business: { displayName: 'Acme <& Co', email: 'b@acme.com', taxNumbers: [] },
      client,
      number: 'INV-001',
      issueDate: '2026-08-01',
      items: [
        {
          description: '<script>alert(1)</script> & consulting',
          quantity: '1',
          rate: '10',
          appliedTaxes: [],
        },
      ],
    });
    const result = renderForPrint({
      document,
      theme: themePresets.clean,
      renderContext: { output: 'print', locale: 'en-CA', timezone: 'UTC' },
    });
    expect(result.html).not.toContain('<script>alert(1)</script>');
    expect(result.html).toContain('&lt;script&gt;');
  });
});