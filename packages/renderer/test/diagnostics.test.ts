import { describe, expect, it } from 'vitest';
import { normalizeDocumentForRendering } from '@invoiceflow/document-schema';
import { themePresets } from '@invoiceflow/theme-schema';

import {
  contrastRatio,
  diagnoseRender,
  paginateSections,
  renderDocumentSections,
  type RenderedPage,
  type RenderedSection,
} from '../src/index.js';

const business = { displayName: 'Acme Inc', email: 'b@acme.com', taxNumbers: [] };
const client = { displayName: 'Client Co', emails: ['c@example.com'] };

function buildSections(
  overrides: Record<string, unknown> = {},
): { sections: readonly RenderedSection[]; pages: readonly RenderedPage[] } {
  const document = normalizeDocumentForRendering({
    kind: 'invoice' as const,
    currencyCode: 'CAD',
    themeVersionId: 'tv-1',
    business,
    client,
    number: 'INV-001',
    issueDate: '2026-08-01',
    items: [
      { description: 'A', quantity: '1', rate: '10', appliedTaxes: [] },
      { description: 'B', quantity: '2', rate: '20', appliedTaxes: [] },
    ],
    ...overrides,
  });
  const ctx = { output: 'preview' as const, locale: 'en-CA', timezone: 'UTC' };
  const sections = renderDocumentSections({
    document,
    theme: themePresets.clean,
    renderContext: ctx,
  }).sections;
  const { pages } = paginateSections({ sections, theme: themePresets.clean });
  return { sections, pages };
}

describe('diagnoseRender', () => {
  it('returns no diagnostics for a clean preset document', () => {
    const { sections, pages } = buildSections();
    const diagnostics = diagnoseRender({
      document: normalizeDocumentForRendering({
        kind: 'invoice' as const,
        currencyCode: 'CAD',
        themeVersionId: 'tv-1',
        business,
        client,
        number: 'INV-001',
        issueDate: '2026-08-01',
        items: [
          { description: 'A', quantity: '1', rate: '10', appliedTaxes: [] },
        ],
      }),
      theme: themePresets.clean,
      sections,
      pages,
    });
    expect(diagnostics).toEqual([]);
  });

  it('flags low contrast between brand primary and page background', () => {
    const { sections, pages } = buildSections();
    const theme = {
      ...themePresets.clean,
      brand: { ...themePresets.clean.brand, primaryColor: '#eeeeee' },
    };
    const diagnostics = diagnoseRender({
      document: normalizeDocumentForRendering({
        kind: 'invoice' as const,
        currencyCode: 'CAD',
        themeVersionId: 'tv-1',
        business,
        client,
        number: 'INV-001',
        issueDate: '2026-08-01',
        items: [],
      }),
      theme,
      sections,
      pages,
    });
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.code === 'LOW_CONTRAST' &&
          diagnostic.severity === 'warning',
      ),
    ).toBe(true);
  });

  it('flags an unsupported font', () => {
    const { sections, pages } = buildSections();
    const theme = {
      ...themePresets.clean,
      typography: { ...themePresets.clean.typography, font: 'Comic Sans' },
    };
    const diagnostics = diagnoseRender({
      document: normalizeDocumentForRendering({
        kind: 'invoice' as const,
        currencyCode: 'CAD',
        themeVersionId: 'tv-1',
        business,
        client,
        number: 'INV-001',
        issueDate: '2026-08-01',
        items: [],
      }),
      theme,
      sections,
      pages,
    });
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'UNSUPPORTED_FONT'),
    ).toBe(true);
  });

  it('flags invalid protected section order', () => {
    const sections = [...buildSections().sections].reverse();
    const pages = buildSections().pages;
    const diagnostics = diagnoseRender({
      document: normalizeDocumentForRendering({
        kind: 'invoice' as const,
        currencyCode: 'CAD',
        themeVersionId: 'tv-1',
        business,
        client,
        number: 'INV-001',
        issueDate: '2026-08-01',
        items: [],
      }),
      theme: themePresets.clean,
      sections,
      pages,
    });
    expect(
      diagnostics.some(
        (diagnostic) => diagnostic.code === 'INVALID_SECTION_ORDER',
      ),
    ).toBe(true);
  });

  it('flags a financial block split when totals and deposit are on different pages', () => {
    const sections = buildSections().sections;
    const pages: readonly RenderedPage[] = [
      {
        pageNumber: 1,
        blocks: [],
      },
      {
        pageNumber: 2,
        blocks: [
          {
            key: 'section:totals',
            kind: 'section',
            type: 'totals',
            section: sections.find((s) => s.key === 'totals')!,
            estimatedHeight: 20,
            keepTogether: true,
            splittable: false,
          },
        ],
      },
      {
        pageNumber: 3,
        blocks: [
          {
            key: 'section:deposit',
            kind: 'section',
            type: 'deposit',
            section: sections.find((s) => s.key === 'deposit')!,
            estimatedHeight: 20,
            keepTogether: true,
            splittable: false,
          },
        ],
      },
    ];
    const diagnostics = diagnoseRender({
      document: normalizeDocumentForRendering({
        kind: 'invoice' as const,
        currencyCode: 'CAD',
        themeVersionId: 'tv-1',
        business,
        client,
        number: 'INV-001',
        issueDate: '2026-08-01',
        items: [],
      }),
      theme: themePresets.clean,
      sections,
      pages,
    });
    expect(
      diagnostics.some(
        (diagnostic) => diagnostic.code === 'FINANCIAL_BLOCK_SPLIT',
      ),
    ).toBe(true);
  });

  it('flags an oversized block as overflow', () => {
    const sections = buildSections().sections;
    const pages: readonly RenderedPage[] = [
      {
        pageNumber: 1,
        blocks: [
          {
            key: 'section:header',
            kind: 'section',
            type: 'header',
            section: sections.find((s) => s.key === 'header')!,
            estimatedHeight: 100000,
            keepTogether: true,
            splittable: false,
          },
        ],
      },
    ];
    const diagnostics = diagnoseRender({
      document: normalizeDocumentForRendering({
        kind: 'invoice' as const,
        currencyCode: 'CAD',
        themeVersionId: 'tv-1',
        business,
        client,
        number: 'INV-001',
        issueDate: '2026-08-01',
        items: [],
      }),
      theme: themePresets.clean,
      sections,
      pages,
    });
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'OVERFLOW'),
    ).toBe(true);
  });
});

describe('contrastRatio', () => {
  it('computes a WCAG-style contrast ratio', () => {
    const ratio = contrastRatio('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21, 1);
  });

  it('is close to 1 for equal colors', () => {
    const ratio = contrastRatio('#2563eb', '#2563eb');
    expect(ratio).toBeCloseTo(1, 5);
  });
});