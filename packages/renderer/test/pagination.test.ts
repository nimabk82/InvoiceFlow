import { describe, expect, it } from 'vitest';
import { normalizeDocumentForRendering } from '@invoiceflow/document-schema';
import { themePresets } from '@invoiceflow/theme-schema';

import {
  buildPageMetrics,
  decomposeBlocks,
  paginateSections,
  renderDocumentSections,
} from '../src/index.js';

const business = {
  displayName: 'Acme Inc',
  legalName: 'Acme Inc.',
  email: 'billing@acme.com',
  phone: '555-0100',
  website: 'acme.com',
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

function makeSections(renderable: Record<string, unknown>) {
  const document = normalizeDocumentForRendering({
    kind: 'invoice' as const,
    currencyCode: 'CAD',
    themeVersionId: 'tv-1',
    business,
    client,
    number: 'INV-001',
    issueDate: '2026-08-01',
    dueDate: '2026-08-31',
    items: [],
    ...renderable,
  });
  return renderDocumentSections({
    document,
    theme: themePresets.clean,
    renderContext: { output: 'preview', locale: 'en-CA', timezone: 'UTC' },
  }).sections;
}

const compactHeight = {
  pageMetrics: { height: 300, marginTop: 24, marginBottom: 24, footerReserve: 40 },
};

describe('buildPageMetrics', () => {
  it('derives letter dimensions with a standard margin and footer reserve', () => {
    const metrics = buildPageMetrics(themePresets.clean.page);
    expect(metrics.width).toBe(612);
    expect(metrics.height).toBe(792);
    expect(metrics.marginTop).toBe(54);
    expect(metrics.footerReserve).toBe(48);
  });

  it('uses A4 dimensions for the minimal preset', () => {
    const metrics = buildPageMetrics(themePresets.minimal.page);
    expect(metrics.width).toBe(595);
    expect(metrics.height).toBe(842);
    expect(metrics.marginTop).toBe(36);
  });

  it('honors explicit overrides', () => {
    const metrics = buildPageMetrics(themePresets.clean.page, {
      height: 400,
      marginTop: 10,
    });
    expect(metrics.height).toBe(400);
    expect(metrics.marginTop).toBe(10);
    expect(metrics.marginRight).toBe(54);
  });
});

describe('decomposeBlocks', () => {
  it('keeps totals and deposit together via keepWithNext', () => {
    const sections = makeSections({});
    const blocks = decomposeBlocks(sections);
    const totals = blocks.find(
      (block) => block.kind === 'section' && block.type === 'totals',
    );
    expect(totals?.kind).toBe('section');
    if (totals?.kind === 'section') {
      expect(totals.keepWithNext).toBe(true);
      expect(totals.keepTogether).toBe(true);
    }
  });

  it('splits the items table into a header plus one block per row', () => {
    const sections = makeSections({
      items: [
        { description: 'A', quantity: '1', rate: '10', appliedTaxes: [] },
        { description: 'B', quantity: '2', rate: '20', appliedTaxes: [] },
        { description: 'C', quantity: '3', rate: '30', appliedTaxes: [] },
      ],
    });
    const blocks = decomposeBlocks(sections);
    const itemBlocks = blocks.filter((block) => block.type === 'items');
    expect(itemBlocks).toHaveLength(4);
    expect(itemBlocks[0].kind).toBe('items-header');
    expect(itemBlocks.filter((block) => block.kind === 'item-row')).toHaveLength(3);
  });

  it('splits long notes into paragraphs', () => {
    const sections = makeSections({
      notes: {
        type: 'doc',
        content: [{ type: 'paragraph', text: 'Para one\nPara two\nPara three' }],
      },
    });
    const blocks = decomposeBlocks(sections);
    const paragraphs = blocks.filter((block) => block.kind === 'paragraph');
    expect(paragraphs.length).toBeGreaterThan(1);
    const heading = blocks.find(
      (block) => block.kind === 'text-heading' && block.type === 'notes',
    );
    expect(heading?.kind).toBe('text-heading');
  });
});

describe('paginateSections', () => {
  it('renders a short document on a single page', () => {
    const sections = makeSections({
      items: [
        { description: 'Consulting', quantity: '1', rate: '500', appliedTaxes: [] },
      ],
    });
    const { pages } = paginateSections({ sections, theme: themePresets.clean });
    expect(pages).toHaveLength(1);
    expect(pages[0].pageNumber).toBe(1);
  });

  it('splits a large item table across pages and repeats the header', () => {
    const items = Array.from({ length: 30 }, (_, i) => ({
      description: `Item ${i}`,
      quantity: '1',
      rate: '10',
      appliedTaxes: [],
    }));
    const sections = makeSections({ items });
    const { pages } = paginateSections({
      sections,
      theme: themePresets.clean,
      ...compactHeight,
    });

    expect(pages.length).toBeGreaterThan(1);

    for (const page of pages) {
      const rows = page.blocks.filter((block) => block.kind === 'item-row');
      if (rows.length > 0) {
        const hasHeader = page.blocks.some(
          (block) => block.kind === 'items-header',
        );
        expect(hasHeader).toBe(true);
      }
    }
  });

  it('never splits a single item row across pages', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      description: `A somewhat long description for item ${i}`,
      quantity: '1',
      rate: '10',
      appliedTaxes: [],
    }));
    const sections = makeSections({ items });
    const contentHeight = 300 - 24 - 24 - 40;
    const { pages } = paginateSections({
      sections,
      theme: themePresets.clean,
      ...compactHeight,
    });

    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) {
      for (const block of page.blocks) {
        if (block.kind === 'item-row') {
          expect(block.estimatedHeight).toBeLessThanOrEqual(contentHeight);
        }
      }
    }
  });

  it('keeps totals and deposit together on the same page', () => {
    const sections = makeSections({
      items: [
        { description: 'A', quantity: '1', rate: '10', appliedTaxes: [] },
      ],
      depositTerms: { type: 'percentage', value: '30' },
    });
    const { pages } = paginateSections({
      sections,
      theme: themePresets.clean,
      ...compactHeight,
    });

    const lastPage = pages[pages.length - 1];
    const hasTotals = lastPage.blocks.some(
      (block) => block.kind === 'section' && block.type === 'totals',
    );
    const hasDeposit = lastPage.blocks.some(
      (block) => block.kind === 'section' && block.type === 'deposit',
    );
    expect(hasTotals).toBe(true);
    expect(hasDeposit).toBe(true);
  });

  it('keeps a notes heading with its first paragraph', () => {
    const sections = makeSections({
      notes: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            text: 'First paragraph that stays with the heading\nSecond long paragraph\nThird paragraph',
          },
        ],
      },
    });
    const { pages } = paginateSections({
      sections,
      theme: themePresets.clean,
      ...compactHeight,
    });

    for (const page of pages) {
      const heading = page.blocks.find(
        (block) => block.kind === 'text-heading' && block.type === 'notes',
      );
      const paragraphs = page.blocks.filter(
        (block) => block.kind === 'paragraph' && block.type === 'notes',
      );
      if (heading && paragraphs.length > 0) {
        expect(paragraphs[0].paragraphIndex).toBe(0);
      }
    }
  });

  it('preserves relative block order within a page', () => {
    const sections = makeSections({
      items: [
        { description: 'A', quantity: '1', rate: '10', appliedTaxes: [] },
        { description: 'B', quantity: '2', rate: '20', appliedTaxes: [] },
      ],
      depositTerms: { type: 'percentage', value: '30' },
    });
    const { pages } = paginateSections({ sections, theme: themePresets.clean });
    expect(pages).toHaveLength(1);

    const keys = pages[0].blocks.map((block) => block.key);
    const itemsIdx = keys.indexOf('items:header');
    const totalsIdx = keys.findIndex((key) => key.startsWith('section:totals'));
    const depositIdx = keys.findIndex((key) => key.startsWith('section:deposit'));
    expect(itemsIdx).toBeGreaterThan(-1);
    expect(totalsIdx).toBeGreaterThan(itemsIdx);
    expect(depositIdx).toBeGreaterThan(totalsIdx);
  });
});