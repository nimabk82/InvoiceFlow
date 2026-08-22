import type { RenderableDocument } from '@invoiceflow/document-schema';
import type { ThemeConfig } from '@invoiceflow/theme-schema';

import type { RenderDiagnostic } from './diagnostics.js';
import { diagnoseRender } from './diagnostics.js';
import type {
  PaginatedDocument,
  RenderedPage,
  RenderedBlock,
} from './pagination.js';
import { paginateDocument } from './pagination.js';
import type { RenderedSection } from './section-renderer.js';
import { renderDocumentSections } from './section-renderer.js';

export type RenderPrintInput = Readonly<{
  document: RenderableDocument;
  theme: ThemeConfig;
  renderContext: Readonly<{
    output: 'print';
    locale: string;
    timezone: string;
  }>;
}>;

export type PrintDocument = Readonly<{
  pages: readonly RenderedPage[];
  diagnostics: readonly RenderDiagnostic[];
  html: string;
}>;

const PAGE_SIZE_CSS = {
  letter: '8.5in 11in',
  a4: '210mm 297mm',
} as const;

const MARGIN_CSS = {
  compact: '0.5in',
  standard: '0.75in',
  spacious: '1in',
} as const;

export function renderForPrint(input: RenderPrintInput): PrintDocument {
  const sections = renderDocumentSections({
    document: input.document,
    theme: input.theme,
    renderContext: {
      output: 'preview',
      locale: input.renderContext.locale,
      timezone: input.renderContext.timezone,
    },
  }).sections;

  const paginated: PaginatedDocument = paginateDocument({
    document: input.document,
    theme: input.theme,
    renderContext: {
      output: 'preview',
      locale: input.renderContext.locale,
      timezone: input.renderContext.timezone,
    },
  });

  const diagnostics = diagnoseRender({
    document: input.document,
    theme: input.theme,
    sections,
    pages: paginated.pages,
  });

  return {
    pages: paginated.pages,
    diagnostics,
    html: buildPrintHtml(
      input.document,
      input.theme,
      paginated.pages,
      diagnostics,
      input.renderContext.locale,
    ),
  };
}

function buildPrintHtml(
  document: RenderableDocument,
  theme: ThemeConfig,
  pages: readonly RenderedPage[],
  diagnostics: readonly RenderDiagnostic[],
  locale: string,
): string {
  const pageCss = PAGE_SIZE_CSS[theme.page.size];
  const marginCss = MARGIN_CSS[theme.page.margin];

  const pageHtml = pages
    .map(
      (page) => `<section class="if-print-page">
  ${page.continuationHeader ? renderContinuationStrip(page.continuationHeader) : ''}
  <div class="if-print-body">${page.blocks.map((block) => renderBlockHtml(block, theme, locale)).join('\n  ')}</div>
  ${page.footer ? renderFooterHtml(page.footer) : ''}
</section>`,
    )
    .join('\n');

  const diagnosticHtml = diagnostics.length
    ? `<div class="if-print-diag">
  <h3>Render diagnostics</h3>
  <ul>${diagnostics.map((d) => `<li class="${d.severity}">${d.code}: ${d.message}</li>`).join('\n  ')}</ul>
</div>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(document.number)} — ${escapeHtml(document.business.displayName)}</title>
<style>
  @page {
    size: ${pageCss};
    margin: ${marginCss};
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: '${escapeHtml(theme.typography.font)}', -apple-system, 'Segoe UI', sans-serif;
    color: #111827;
    background: #fff;
  }
  .if-print-page {
    page-break-after: always;
    break-after: page;
    width: 100%;
    min-height: 100%;
    padding: 0;
    position: relative;
  }
  .if-print-page:last-child { page-break-after: auto; break-after: auto; }
  .if-print-cont-strip {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 11px;
    color: #475467;
    border-bottom: 2px solid ${theme.brand.primaryColor};
    padding-bottom: 6px;
    margin-bottom: 22px;
  }
  .if-print-cont-strip strong { color: #101828; }
  .if-print-head { display: flex; justify-content: space-between; align-items: flex-start; }
  .if-print-head strong { color: ${theme.brand.primaryColor}; font-size: 20px; }
  .if-print-head span { font-weight: 800; letter-spacing: .08em; font-size: 12px; }
  .if-print-business { margin-top: 20px; font-size: 13px; color: #475467; }
  .if-print-doc-info { display: flex; justify-content: space-between; margin-top: 30px; font-size: 12px; color: #475467; }
  .if-print-doc-info strong { color: #111827; }
  .if-print-billto { margin-top: 28px; padding: 12px; background: ${theme.billTo.style === 'soft' ? (theme.brand.secondaryColor ?? '#f3f4f6') : 'transparent'}; border-radius: 8px; }
  .if-print-billto .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
  .if-print-billto strong { display: block; margin-top: 4px; }
  .if-print-billto div { font-size: 12px; color: #6b7280; }
  .if-print-items { margin-top: 30px; }
  .if-print-t-head { display: grid; grid-template-columns: 1fr 70px 90px 100px; gap: 12px; padding: 8px; font-size: 11px; font-weight: 800; color: #6b7280; border-bottom: 2px solid #111827; }
  .if-print-t-row { display: grid; grid-template-columns: 1fr 70px 90px 100px; gap: 12px; padding: 8px; font-size: 12px; border-bottom: 1px solid #f0f2f5; }
  .if-print-t-row .sub { display: block; font-size: 11px; color: #6b7280; margin-top: 2px; }
  .r { text-align: right; }
  .if-print-totals { width: 300px; margin-left: auto; margin-top: 22px; }
  .if-print-totals > div { display: flex; justify-content: space-between; font-size: 12px; padding: 5px 0; }
  .if-print-totals .total { border-top: 1px solid #e5e7eb; margin-top: 6px; padding-top: 12px; font-size: 16px; font-weight: 800; color: ${theme.brand.primaryColor}; }
  .if-print-deposit { background: ${theme.brand.primaryColor}14; border: 1px solid ${theme.brand.primaryColor}33; border-radius: 8px; padding: 12px; margin-top: 12px; width: 300px; margin-left: auto; font-weight: 800; color: ${theme.brand.primaryColor}; font-size: 13px; }
  .if-print-deposit div { display: flex; justify-content: space-between; }
  .if-print-texthead { margin-top: 28px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
  .if-print-text { font-size: 12px; color: #475467; margin-top: 6px; white-space: pre-line; }
  .if-print-footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; text-align: ${theme.footer.alignment}; font-size: 12px; color: #6b7280; }
  .if-print-diag { margin: 24px 0 0; padding: 12px 16px; border: 1px solid #f59e0b; border-radius: 8px; background: #fffbeb; font-size: 12px; color: #92400e; }
  .if-print-diag h3 { margin: 0 0 6px; font-size: 12px; }
  .if-print-diag ul { margin: 0; padding-left: 18px; }
  .if-print-diag li.error { color: #b91c1c; }
  .if-print-diag li.warning { color: #92400e; }
</style>
</head>
<body>
${pageHtml}
${diagnosticHtml}
</body>
</html>`;
}

function renderContinuationStrip(
  header: NonNullable<RenderedPage['continuationHeader']>,
): string {
  const parts = [
    header.businessName ? `<strong>${escapeHtml(header.businessName)}</strong>` : '',
    header.documentNumber ? `<span>${escapeHtml(header.documentNumber)} · continued</span>` : '',
  ].filter(Boolean);
  return `<div class="if-print-cont-strip">${parts.join('\n  ')}</div>`;
}

function renderFooterHtml(
  footer: NonNullable<RenderedPage['footer']>,
): string {
  const parts = [
    ...footer.parts,
    footer.showPageNumber ? `Page ${footer.pageNumber}` : '',
  ].filter(Boolean);
  return `<div class="if-print-footer">${parts.map(escapeHtml).join(' · ')}</div>`;
}

function renderBlockHtml(
  block: RenderedBlock,
  theme: ThemeConfig,
  locale: string,
): string {
  switch (block.kind) {
    case 'section':
      return renderSectionHtml(block.section, theme, locale);
    case 'items-header':
      return renderItemsHeader(block.section);
    case 'item-row':
      return renderItemRow(block.row, locale);
    case 'text-heading':
      return `<div class="if-print-texthead">${escapeHtml(block.label)}</div>`;
    case 'paragraph':
      return `<div class="if-print-text">${escapeHtml(block.paragraph)}</div>`;
  }
}

function renderSectionHtml(
  section: RenderedSection,
  theme: ThemeConfig,
  locale: string,
): string {
  switch (section.key) {
    case 'header':
      return `<div class="if-print-head"><strong>${escapeHtml(section.businessName)}</strong><span>INVOICE</span></div>`;
    case 'business':
      return `<div class="if-print-business">${[section.displayName, section.email, section.phone, section.website].filter((value): value is string => Boolean(value)).map(escapeHtml).join('<br>')}</div>`;
    case 'document-info': {
      const rows = [
        section.issueDate ? `Issue: ${section.issueDate}` : undefined,
        section.dueDate ? `Due: ${section.dueDate}` : undefined,
        section.validUntil ? `Valid until: ${section.validUntil}` : undefined,
        section.poNumber ? `PO: ${section.poNumber}` : undefined,
      ].filter((value): value is string => Boolean(value));
      return `<div class="if-print-doc-info"><strong>${escapeHtml(section.number)}</strong><div>${rows.map(escapeHtml).join('<br>')}</div></div>`;
    }
    case 'bill-to': {
      const lines = [
        section.displayName,
        ...section.emails,
        section.phone,
        section.address,
        section.taxNumber ? `Tax: ${section.taxNumber}` : undefined,
      ].filter((value): value is string => Boolean(value));
      return `<div class="if-print-billto"><div class="label">Bill to</div><strong>${escapeHtml(section.displayName)}</strong>${lines.slice(1).map((line) => `<div>${escapeHtml(line)}</div>`).join('')}</div>`;
    }
    case 'totals':
      return `<div class="if-print-totals">${section.rows.map((row) => `<div class="${row.emphasis ? 'total' : ''}"><span>${escapeHtml(row.label)}</span><span>${formatMoney(row.value, locale)}</span></div>`).join('')}</div>`;
    case 'deposit':
      return `<div class="if-print-deposit"><div><span>Deposit due now</span><span>${formatMoney(section.required, locale)}</span></div><div><span>Remaining</span><span>${formatMoney(section.remaining, locale)}</span></div></div>`;
    case 'payment':
      return section.content
        ? `<div class="if-print-text">${escapeHtml(section.content)}</div>`
        : '';
    default:
      return '';
  }
}

function renderItemsHeader(
  section: Extract<RenderedSection, { key: 'items' }>,
): string {
  const columns = ['Description'];
  if (section.showQuantity) columns.push('Qty');
  if (section.showRate) columns.push('Rate');
  columns.push('Amount');

  const template = `1fr ${columns.slice(1).map(() => '90px').join(' ')}`;
  return `<div class="if-print-t-head" style="grid-template-columns:${template}">${columns.map((col) => `<span class="${col === 'Amount' ? 'r' : ''}">${col}</span>`).join('')}</div>`;
}

function renderItemRow(
  row: Extract<RenderedBlock, { kind: 'item-row' }>['row'],
  locale: string,
): string {
  const columns = [
    `<span>${escapeHtml(row.description)}${row.secondaryDescription ? `<span class="sub">${escapeHtml(row.secondaryDescription)}</span>` : ''}</span>`,
    `<span class="r">${escapeHtml(row.quantity)}</span>`,
    `<span class="r">${formatMoney(row.rate, locale)}</span>`,
    `<span class="r">${formatMoney(row.amount, locale)}</span>`,
  ];
  return `<div class="if-print-t-row">${columns.join('')}</div>`;
}

function formatMoney(value: string, locale: string): string {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}