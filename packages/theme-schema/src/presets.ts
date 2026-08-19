import type { ThemeConfig } from './config.js';

const defaultSections: ThemeConfig['sections'] = [
  { id: 'header', enabled: true },
  { id: 'business', enabled: true },
  { id: 'document-info', enabled: true },
  { id: 'bill-to', enabled: true },
  { id: 'items', enabled: true },
  { id: 'totals', enabled: true },
  { id: 'deposit', enabled: true },
  { id: 'payment', enabled: true },
  { id: 'notes', enabled: true },
  { id: 'terms', enabled: true },
  { id: 'footer', enabled: true },
];

export const themePresets = {
  clean: {
    page: {
      size: 'letter',
      margin: 'standard',
      backgroundColor: '#ffffff',
      border: 'none',
    },
    brand: {
      logoSize: 'medium',
      primaryColor: '#2563eb',
      secondaryColor: '#dbeafe',
    },
    typography: {
      font: 'Inter',
      headingScale: 'comfortable',
    },
    header: { layout: 'classic' },
    billTo: { style: 'soft' },
    items: {
      headerStyle: 'line',
      rowStyle: 'plain',
      showQuantity: true,
      showRate: true,
      showTax: true,
    },
    totals: { layout: 'right', emphasis: 'bold' },
    deposit: { style: 'highlight' },
    footer: {
      alignment: 'center',
      showBusinessName: true,
      showWebsite: true,
      showPageNumber: true,
      showDivider: true,
    },
    sections: defaultSections,
  },
  modern: {
    page: {
      size: 'letter',
      margin: 'standard',
      backgroundColor: '#ffffff',
      border: 'none',
    },
    brand: {
      logoSize: 'large',
      primaryColor: '#111827',
      secondaryColor: '#6d28d9',
    },
    typography: {
      font: 'Montserrat',
      headingScale: 'comfortable',
    },
    header: { layout: 'split' },
    billTo: { style: 'bordered' },
    items: {
      headerStyle: 'filled',
      rowStyle: 'separators',
      showQuantity: true,
      showRate: true,
      showTax: true,
    },
    totals: { layout: 'boxed', emphasis: 'accent-line' },
    deposit: { style: 'boxed' },
    footer: {
      alignment: 'right',
      showBusinessName: true,
      showWebsite: true,
      showPageNumber: true,
      showDivider: false,
    },
    sections: defaultSections,
  },
  minimal: {
    page: {
      size: 'a4',
      margin: 'compact',
      backgroundColor: '#ffffff',
      border: 'none',
    },
    brand: {
      logoSize: 'small',
      primaryColor: '#111111',
      secondaryColor: '#f5f5f5',
    },
    typography: {
      font: 'Inter',
      headingScale: 'compact',
    },
    header: { layout: 'minimal' },
    billTo: { style: 'plain' },
    items: {
      headerStyle: 'minimal',
      rowStyle: 'plain',
      showQuantity: true,
      showRate: true,
      showTax: false,
    },
    totals: { layout: 'right', emphasis: 'bold' },
    deposit: { style: 'plain' },
    footer: {
      alignment: 'left',
      showBusinessName: false,
      showWebsite: false,
      showPageNumber: true,
      showDivider: false,
    },
    sections: defaultSections,
  },
  blank: {
    page: {
      size: 'letter',
      margin: 'standard',
      backgroundColor: '#ffffff',
      border: 'none',
    },
    brand: {
      logoSize: 'medium',
      primaryColor: '#000000',
    },
    typography: {
      font: 'Inter',
      headingScale: 'comfortable',
    },
    header: { layout: 'classic' },
    billTo: { style: 'plain' },
    items: {
      headerStyle: 'line',
      rowStyle: 'plain',
      showQuantity: true,
      showRate: true,
      showTax: true,
    },
    totals: { layout: 'right', emphasis: 'bold' },
    deposit: { style: 'plain' },
    footer: {
      alignment: 'center',
      showBusinessName: true,
      showWebsite: true,
      showPageNumber: true,
      showDivider: false,
    },
    sections: defaultSections,
  },
} as const satisfies Record<string, ThemeConfig>;

export type ThemePresetName = keyof typeof themePresets;

export const themePresetNames = Object.keys(themePresets) as ThemePresetName[];
