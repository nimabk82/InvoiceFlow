import type { RenderableDocument } from '@invoiceflow/document-schema';
import type { ThemeConfig } from '@invoiceflow/theme-schema';

import type { RenderDiagnostic } from './diagnostics.js';
import type { RenderedPage, PageMetrics } from './pagination.js';
import { buildPageMetrics } from './pagination.js';
import type { PrintDocument } from './print-adapter.js';
import { renderForPrint } from './print-adapter.js';

export type RenderPdfInput = Readonly<{
  document: RenderableDocument;
  theme: ThemeConfig;
  renderContext: Readonly<{
    output: 'pdf';
    locale: string;
    timezone: string;
  }>;
}>;

export type PdfPageSpec = Readonly<{
  widthPoints: number;
  heightPoints: number;
  marginPoints: number;
  pageNumber: number;
}>;

export type PdfRenderSpec = Readonly<{
  pageSize: ThemeConfig['page']['size'];
  page: PdfPageSpec;
  pageCount: number;
  footerReserve: number;
  continuationHeaderHeight: number;
}>;

export type PdfDocument = Readonly<{
  pages: readonly RenderedPage[];
  diagnostics: readonly RenderDiagnostic[];
  html: string;
  pdf: PdfRenderSpec;
}>;

const PAGES_PER_INCH = 72;

const PAGE_POINTS = {
  letter: { width: 8.5 * PAGES_PER_INCH, height: 11 * PAGES_PER_INCH },
  a4: { width: 8.27 * PAGES_PER_INCH, height: 11.69 * PAGES_PER_INCH },
} as const satisfies Record<ThemeConfig['page']['size'], { width: number; height: number }>;

const MARGIN_POINTS = {
  compact: 0.5 * PAGES_PER_INCH,
  standard: 0.75 * PAGES_PER_INCH,
  spacious: 1 * PAGES_PER_INCH,
} as const satisfies Record<ThemeConfig['page']['margin'], number>;

export function renderForPdf(input: RenderPdfInput): PdfDocument {
  const print: PrintDocument = renderForPrint({
    document: input.document,
    theme: input.theme,
    renderContext: {
      output: 'print',
      locale: input.renderContext.locale,
      timezone: input.renderContext.timezone,
    },
  });

  const metrics: PageMetrics = buildPageMetrics(input.theme.page);
  const size = PAGE_POINTS[input.theme.page.size];
  const margin = MARGIN_POINTS[input.theme.page.margin];

  const pdf: PdfRenderSpec = {
    pageSize: input.theme.page.size,
    page: {
      widthPoints: size.width,
      heightPoints: size.height,
      marginPoints: margin,
      pageNumber: 1,
    },
    pageCount: print.pages.length,
    footerReserve: metrics.footerReserve,
    continuationHeaderHeight: metrics.continuationHeaderHeight,
  };

  return {
    pages: print.pages,
    diagnostics: print.diagnostics,
    html: print.html,
    pdf,
  };
}