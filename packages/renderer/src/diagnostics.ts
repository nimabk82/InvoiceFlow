import type { RenderableDocument } from '@invoiceflow/document-schema';
import type { ThemeConfig } from '@invoiceflow/theme-schema';

import type {
  RenderedPage,
  PageMetrics,
} from './pagination.js';
import { buildPageMetrics } from './pagination.js';
import type { RenderedSection } from './section-renderer.js';

export type RenderDiagnosticCode =
  | 'LOW_CONTRAST'
  | 'OVERFLOW'
  | 'UNSUPPORTED_FONT'
  | 'INVALID_SECTION_ORDER'
  | 'FINANCIAL_BLOCK_SPLIT';

export type RenderDiagnosticSeverity = 'error' | 'warning';

export type RenderDiagnostic = Readonly<{
  code: RenderDiagnosticCode;
  severity: RenderDiagnosticSeverity;
  message: string;
}>;

export type DiagnoseRenderInput = Readonly<{
  document: RenderableDocument;
  theme: ThemeConfig;
  sections: readonly RenderedSection[];
  pages: readonly RenderedPage[];
  pageMetrics?: Partial<PageMetrics>;
}>;

const CURATED_FONTS: readonly string[] = [
  'Inter',
  'Montserrat',
  'Lato',
  'Open Sans',
  'Roboto',
  'Georgia',
  'Times New Roman',
  'Arial',
  'Helvetica',
];

export function diagnoseRender(input: DiagnoseRenderInput): readonly RenderDiagnostic[] {
  const diagnostics: RenderDiagnostic[] = [];

  checkContrast(input.theme, diagnostics);
  checkFont(input.theme, diagnostics);
  checkSectionOrder(input.sections, input.document.deposit !== undefined, diagnostics);
  checkFinancialBlockSplit(input.pages, diagnostics);
  checkOverflow(input.theme, input.pages, input.pageMetrics, diagnostics);

  return diagnostics;
}

function checkContrast(
  theme: ThemeConfig,
  diagnostics: RenderDiagnostic[],
): void {
  const primary = theme.brand.primaryColor;
  const background = theme.page.backgroundColor;

  if (!isHexColor(primary) || !isHexColor(background)) {
    return;
  }

  const ratio = contrastRatio(primary, background);
  if (ratio < 4.5) {
    diagnostics.push({
      code: 'LOW_CONTRAST',
      severity: 'warning',
      message: `Brand primary color ${primary} has low contrast (${ratio.toFixed(2)}:1) against the page background.`,
    });
  }
}

function checkFont(
  theme: ThemeConfig,
  diagnostics: RenderDiagnostic[],
): void {
  const font = theme.typography.font;
  if (font && !CURATED_FONTS.includes(font)) {
    diagnostics.push({
      code: 'UNSUPPORTED_FONT',
      severity: 'warning',
      message: `Font "${font}" is not in the curated set; rendering may fall back to a system font.`,
    });
  }
}

function checkSectionOrder(
  sections: readonly RenderedSection[],
  hasDeposit: boolean,
  diagnostics: RenderDiagnostic[],
): void {
  const keys = sections.map((section) => section.key);
  const itemsIndex = keys.indexOf('items');
  const totalsIndex = keys.indexOf('totals');
  const depositIndex = keys.indexOf('deposit');
  const footerIndex = keys.indexOf('footer');

  if (itemsIndex === -1 || totalsIndex === -1) {
    diagnostics.push({
      code: 'INVALID_SECTION_ORDER',
      severity: 'error',
      message: 'Items and Totals sections are required.',
    });
  } else if (hasDeposit && depositIndex === -1) {
    diagnostics.push({
      code: 'INVALID_SECTION_ORDER',
      severity: 'error',
      message: 'Deposit section is required when the document has a deposit.',
    });
  } else if (
    hasDeposit &&
    !(itemsIndex < totalsIndex && totalsIndex < depositIndex)
  ) {
    diagnostics.push({
      code: 'INVALID_SECTION_ORDER',
      severity: 'error',
      message: 'Sections must follow protected order: Items < Totals < Deposit.',
    });
  }

  if (footerIndex !== -1 && footerIndex !== keys.length - 1) {
    diagnostics.push({
      code: 'INVALID_SECTION_ORDER',
      severity: 'error',
      message: 'Footer must be the last section.',
    });
  }
}

function checkFinancialBlockSplit(
  pages: readonly RenderedPage[],
  diagnostics: RenderDiagnostic[],
): void {
  const totalsPage = pages.find((page) =>
    page.blocks.some((block) => block.type === 'totals'),
  );
  const depositPage = pages.find((page) =>
    page.blocks.some((block) => block.type === 'deposit'),
  );

  if (totalsPage && depositPage && totalsPage !== depositPage) {
    diagnostics.push({
      code: 'FINANCIAL_BLOCK_SPLIT',
      severity: 'error',
      message: 'Totals and Deposit are split across pages and must stay together.',
    });
  }
}

function checkOverflow(
  theme: ThemeConfig,
  pages: readonly RenderedPage[],
  pageMetrics: Partial<PageMetrics> | undefined,
  diagnostics: RenderDiagnostic[],
): void {
  const metrics = buildPageMetrics(theme.page, pageMetrics);

  for (const page of pages) {
    const contentHeight =
      metrics.height - metrics.marginTop - metrics.marginBottom - metrics.footerReserve;

    for (const block of page.blocks) {
      if (block.estimatedHeight > contentHeight) {
        diagnostics.push({
          code: 'OVERFLOW',
          severity: 'error',
          message: `Block "${block.key}" (${block.estimatedHeight}px) is taller than the available page height (${contentHeight}px).`,
        });
      }
    }
  }
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function channel(value: string): number {
  return parseInt(value, 16) / 255;
}

function linearize(channelValue: number): number {
  return channelValue <= 0.03928
    ? channelValue / 12.92
    : ((channelValue + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const red = linearize(channel(hex.slice(1, 3)));
  const green = linearize(channel(hex.slice(3, 5)));
  const blue = linearize(channel(hex.slice(5, 7)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}