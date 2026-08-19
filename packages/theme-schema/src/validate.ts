import {
  alignments,
  billToStyles,
  borderOptions,
  depositStyles,
  headerLayouts,
  headingScales,
  itemHeaderStyles,
  itemRowStyles,
  logoSizes,
  marginOptions,
  pageSizes,
  totalsEmphases,
  totalsLayouts,
} from './config.js';

export type ThemeIssue = Readonly<{
  code: string;
  message: string;
  path: string;
}>;

export type ThemeValidationResult = Readonly<{
  valid: boolean;
  issues: readonly ThemeIssue[];
}>;

const hexColor = /^#[0-9a-fA-F]{6}$/;

export function validateThemeConfig(config: unknown): ThemeValidationResult {
  const issues: ThemeIssue[] = [];
  const record = isRecord(config) ? config : {};

  validatePage(record.page, issues);
  validateBrand(record.brand, issues);
  validateTypography(record.typography, issues);
  validateSectionControls(record, issues);
  validateSections(record.sections, issues);

  return { valid: issues.length === 0, issues };
}

function validatePage(value: unknown, issues: ThemeIssue[]): void {
  const page = isRecord(value) ? value : {};

  requireOneOf(page.size, pageSizes, 'page.size', issues);
  requireOneOf(page.margin, marginOptions, 'page.margin', issues);
  requireOneOf(page.border, borderOptions, 'page.border', issues);
  requireHexColor(page.backgroundColor, 'page.backgroundColor', issues);
}

function validateBrand(value: unknown, issues: ThemeIssue[]): void {
  const brand = isRecord(value) ? value : {};
  requireHexColor(brand.primaryColor, 'brand.primaryColor', issues);
  requireHexColor(brand.secondaryColor, 'brand.secondaryColor', issues);

  if (brand.logoSize !== undefined) {
    requireOneOf(brand.logoSize, logoSizes, 'brand.logoSize', issues);
  }
}

function validateTypography(value: unknown, issues: ThemeIssue[]): void {
  const typography = isRecord(value) ? value : {};

  if (typeof typography.font !== 'string' || typography.font.trim() === '') {
    push(issues, 'font_required', 'A font is required.', 'typography.font');
  }

  requireOneOf(typography.headingScale, headingScales, 'typography.headingScale', issues);
}

function validateSectionControls(value: Record<string, unknown>, issues: ThemeIssue[]): void {
  const header = isRecord(value.header) ? value.header : {};
  const billTo = isRecord(value.billTo) ? value.billTo : {};
  const items = isRecord(value.items) ? value.items : {};
  const totals = isRecord(value.totals) ? value.totals : {};
  const deposit = isRecord(value.deposit) ? value.deposit : {};
  const footer = isRecord(value.footer) ? value.footer : {};

  requireOneOf(header.layout, headerLayouts, 'header.layout', issues);
  requireOneOf(billTo.style, billToStyles, 'billTo.style', issues);
  requireOneOf(items.headerStyle, itemHeaderStyles, 'items.headerStyle', issues);
  requireOneOf(items.rowStyle, itemRowStyles, 'items.rowStyle', issues);
  requireOneOf(totals.layout, totalsLayouts, 'totals.layout', issues);
  requireOneOf(totals.emphasis, totalsEmphases, 'totals.emphasis', issues);
  requireOneOf(deposit.style, depositStyles, 'deposit.style', issues);
  requireOneOf(footer.alignment, alignments, 'footer.alignment', issues);
}

function validateSections(value: unknown, issues: ThemeIssue[]): void {
  const sections = Array.isArray(value)
    ? value.filter(isRecord)
    : [];

  const order = sections.map((section) => section.id);

  const itemsIndex = order.indexOf('items');
  const totalsIndex = order.indexOf('totals');
  const depositIndex = order.indexOf('deposit');
  const footerIndex = order.indexOf('footer');

  if (itemsIndex === -1 || totalsIndex === -1 || depositIndex === -1) {
    push(
      issues,
      'missing_section',
      'Items, Totals, and Deposit sections are required.',
      'sections',
    );
  } else if (!(itemsIndex < totalsIndex && totalsIndex < depositIndex)) {
    push(
      issues,
      'invalid_section_order',
      'Sections must follow Items < Totals < Deposit.',
      'sections',
    );
  }

  if (footerIndex !== -1 && footerIndex !== sections.length - 1) {
    push(issues, 'footer_not_last', 'Footer must be the last section.', 'sections');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf(value: unknown, options: readonly string[]): boolean {
  return typeof value === 'string' && options.includes(value);
}

function requireOneOf(
  value: unknown,
  options: readonly string[],
  path: string,
  issues: ThemeIssue[],
): void {
  if (!isOneOf(value, options)) {
    push(issues, 'invalid_value', `Invalid value for ${path}.`, path);
  }
}

function requireHexColor(value: unknown, path: string, issues: ThemeIssue[]): void {
  if (value === undefined) {
    return;
  }

  if (typeof value !== 'string' || !hexColor.test(value)) {
    push(issues, 'invalid_color', `Invalid color for ${path}.`, path);
  }
}

function push(issues: ThemeIssue[], code: string, message: string, path: string): void {
  issues.push({ code, message, path });
}
