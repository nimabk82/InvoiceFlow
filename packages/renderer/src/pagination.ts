import type { ThemeConfig } from '@invoiceflow/theme-schema';

import type {
  RenderedDocument,
  RenderedItemRow,
  RenderedSection,
  RenderDocumentInput,
} from './section-renderer.js';
import { renderDocumentSections } from './section-renderer.js';

export type PageSize = 'letter' | 'a4';
export type MarginOption = 'compact' | 'standard' | 'spacious';

export type PageMetrics = Readonly<{
  width: number;
  height: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  footerReserve: number;
}>;

const PAGE_SIZES = {
  letter: { width: 612, height: 792 },
  a4: { width: 595, height: 842 },
} as const satisfies Record<PageSize, { width: number; height: number }>;

const MARGINS = {
  compact: 36,
  standard: 54,
  spacious: 72,
} as const satisfies Record<MarginOption, number>;

const FOOTER_RESERVE = 48;

export function buildPageMetrics(
  page: ThemeConfig['page'],
  overrides?: Partial<PageMetrics>,
): PageMetrics {
  const size = PAGE_SIZES[page.size];
  const margin = MARGINS[page.margin];

  return {
    width: overrides?.width ?? size.width,
    height: overrides?.height ?? size.height,
    marginTop: overrides?.marginTop ?? margin,
    marginRight: overrides?.marginRight ?? margin,
    marginBottom: overrides?.marginBottom ?? margin,
    marginLeft: overrides?.marginLeft ?? margin,
    footerReserve: overrides?.footerReserve ?? FOOTER_RESERVE,
  };
}

type RenderedItemsSection = Extract<RenderedSection, { key: 'items' }>;
type RenderedTextSection = Extract<RenderedSection, { key: 'notes' | 'terms' }>;

type BlockBase = {
  key: string;
  estimatedHeight: number;
  keepTogether: boolean;
  keepWithNext?: boolean;
  splittable: boolean;
};

export type RenderedBlock =
  | (BlockBase & { kind: 'section'; type: SectionId; section: RenderedSection })
  | (BlockBase & {
      kind: 'items-header';
      type: 'items';
      section: RenderedItemsSection;
    })
  | (BlockBase & {
      kind: 'item-row';
      type: 'items';
      section: RenderedItemsSection;
      rowIndex: number;
      row: RenderedItemRow;
    })
  | (BlockBase & { kind: 'text-heading'; type: 'notes' | 'terms'; label: string })
  | (BlockBase & {
      kind: 'paragraph';
      type: 'notes' | 'terms';
      section: RenderedTextSection;
      paragraphIndex: number;
      paragraph: string;
    });

type SectionId = RenderedSection['key'];

export type RenderedPage = Readonly<{
  pageNumber: number;
  blocks: readonly RenderedBlock[];
}>;

export type PaginatedDocument = Readonly<{
  pages: readonly RenderedPage[];
}>;

export type PaginateSectionsInput = Readonly<{
  sections: readonly RenderedSection[];
  theme: ThemeConfig;
  pageMetrics?: Partial<PageMetrics>;
}>;

const LINE_HEIGHT = 14;
const SECTION_GAP = 16;
const ITEM_HEADER_HEIGHT = 18;
const ITEM_ROW_PADDING = 8;
const TEXT_HEADING_HEIGHT = 18;

export function decomposeBlocks(
  sections: readonly RenderedSection[],
): RenderedBlock[] {
  const blocks: RenderedBlock[] = [];

  for (const section of sections) {
    switch (section.key) {
      case 'header':
      case 'business':
      case 'document-info':
      case 'bill-to':
      case 'totals':
      case 'deposit':
      case 'payment':
      case 'footer':
        blocks.push({
          kind: 'section',
          key: `section:${section.key}`,
          type: section.key,
          section,
          estimatedHeight: sectionHeight(section),
          keepTogether: true,
          keepWithNext: section.key === 'totals',
          splittable: false,
        });
        break;
      case 'items':
        blocks.push({
          kind: 'items-header',
          key: 'items:header',
          type: 'items',
          section,
          estimatedHeight: ITEM_HEADER_HEIGHT,
          keepTogether: true,
          keepWithNext: true,
          splittable: false,
        });
        section.rows.forEach((row, rowIndex) => {
          blocks.push({
            kind: 'item-row',
            key: `items:row:${rowIndex}`,
            type: 'items',
            section,
            rowIndex,
            row,
            estimatedHeight: itemRowHeight(row),
            keepTogether: true,
            splittable: false,
          });
        });
        break;
      case 'notes':
      case 'terms':
        pushTextBlocks(blocks, section);
        break;
    }
  }

  return blocks;
}

function pushTextBlocks(
  blocks: RenderedBlock[],
  section: RenderedTextSection,
): void {
  const label = section.key === 'notes' ? 'Notes' : 'Terms';
  const paragraphs = splitParagraphs(section.content);

  blocks.push({
    kind: 'text-heading',
    key: `${section.key}:heading`,
    type: section.key,
    label,
    estimatedHeight: TEXT_HEADING_HEIGHT,
    keepTogether: true,
    keepWithNext: true,
    splittable: false,
  });

  paragraphs.forEach((paragraph, paragraphIndex) => {
    blocks.push({
      kind: 'paragraph',
      key: `${section.key}:paragraph:${paragraphIndex}`,
      type: section.key,
      section,
      paragraphIndex,
      paragraph,
      estimatedHeight: paragraphHeight(paragraph),
      keepTogether: true,
      splittable: false,
    });
  });
}

function splitParagraphs(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

function paragraphHeight(paragraph: string): number {
  return lineCount(paragraph) * LINE_HEIGHT;
}

function sectionHeight(section: RenderedSection): number {
  switch (section.key) {
    case 'header':
      return 40;
    case 'business': {
      const lines = [
        section.displayName,
        section.legalName,
        section.email,
        section.phone,
        section.website,
      ].filter(Boolean).length;
      return Math.max(1, lines) * LINE_HEIGHT + SECTION_GAP;
    }
    case 'document-info':
      return 2 * LINE_HEIGHT + SECTION_GAP;
    case 'bill-to': {
      const lines =
        1 +
        section.emails.length +
        (section.phone ? 1 : 0) +
        (section.address ? lineCount(section.address) : 0) +
        (section.taxNumber ? 1 : 0);
      return Math.max(3, lines) * LINE_HEIGHT + SECTION_GAP;
    }
    case 'totals':
      return section.rows.length * LINE_HEIGHT + SECTION_GAP + 8;
    case 'deposit':
      return 2 * LINE_HEIGHT + SECTION_GAP;
    case 'payment':
      return section.content ? 2 * LINE_HEIGHT : 0;
    case 'footer':
      return FOOTER_RESERVE;
    default:
      return LINE_HEIGHT + SECTION_GAP;
  }
}

function itemRowHeight(row: RenderedItemRow): number {
  const lines = Math.max(
    1,
    lineCount(row.description) +
      (row.secondaryDescription ? lineCount(row.secondaryDescription) : 0),
  );
  return lines * LINE_HEIGHT + ITEM_ROW_PADDING;
}

function lineCount(text: string): number {
  return text.split('\n').length;
}

export function paginateSections(
  input: PaginateSectionsInput,
): PaginatedDocument {
  const metrics = buildPageMetrics(input.theme.page, input.pageMetrics);
  const blocks = decomposeBlocks(input.sections);
  const contentHeight =
    metrics.height - metrics.marginTop - metrics.marginBottom - metrics.footerReserve;

  const pages: { blocks: RenderedBlock[] }[] = [];
  let current: RenderedBlock[] = [];
  let used = 0;

  const pushPage = (): void => {
    if (current.length > 0) {
      pages.push({ blocks: current });
      current = [];
      used = 0;
    }
  };

  const repeatItemsHeader = (rowBlock: Extract<RenderedBlock, { kind: 'item-row' }>): void => {
    if (
      current.some(
        (block) =>
          block.kind === 'items-header' && block.section === rowBlock.section,
      )
    ) {
      return;
    }
    const header: RenderedBlock = {
      kind: 'items-header',
      key: `${rowBlock.section.key}:header`,
      type: 'items',
      section: rowBlock.section,
      estimatedHeight: ITEM_HEADER_HEIGHT,
      keepTogether: true,
      keepWithNext: true,
      splittable: false,
    };
    current.push(header);
    used += header.estimatedHeight;
  };

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (!block) {
      continue;
    }
    const next = blocks[i + 1];

    if (block.keepWithNext && next) {
      const combined = block.estimatedHeight + next.estimatedHeight;
      if (combined <= contentHeight && used + combined > contentHeight) {
        pushPage();
      }
    }

    if (block.kind === 'item-row') {
      repeatItemsHeader(block);
    }

    const fits = block.estimatedHeight <= contentHeight;
    if (fits && used + block.estimatedHeight > contentHeight) {
      pushPage();
      if (block.kind === 'item-row') {
        repeatItemsHeader(block);
      }
    }

    current.push(block);
    used += block.estimatedHeight;
  }

  pushPage();

  return {
    pages: pages.map((page, index) => ({
      pageNumber: index + 1,
      blocks: page.blocks,
    })),
  };
}

export function paginateDocument(
  input: RenderDocumentInput,
): PaginatedDocument {
  const rendered: RenderedDocument = renderDocumentSections(input);
  return paginateSections({
    sections: rendered.sections,
    theme: input.theme,
  });
}