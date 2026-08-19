export const pageSizes = ['letter', 'a4'] as const;
export type PageSize = (typeof pageSizes)[number];

export const marginOptions = ['compact', 'standard', 'spacious'] as const;
export type MarginOption = (typeof marginOptions)[number];

export const borderOptions = ['none', 'thin', 'accent'] as const;
export type BorderOption = (typeof borderOptions)[number];

export const logoSizes = ['small', 'medium', 'large'] as const;
export type LogoSize = (typeof logoSizes)[number];

export const headingScales = ['compact', 'comfortable'] as const;
export type HeadingScale = (typeof headingScales)[number];

export const headerLayouts = ['classic', 'split', 'centered', 'minimal'] as const;
export type HeaderLayout = (typeof headerLayouts)[number];

export const billToStyles = ['plain', 'soft', 'bordered', 'accent-edge'] as const;
export type BillToStyle = (typeof billToStyles)[number];

export const itemHeaderStyles = ['filled', 'soft', 'line', 'minimal'] as const;
export type ItemHeaderStyle = (typeof itemHeaderStyles)[number];

export const itemRowStyles = ['plain', 'separators', 'striped'] as const;
export type ItemRowStyle = (typeof itemRowStyles)[number];

export const totalsLayouts = ['right', 'full-width', 'boxed'] as const;
export type TotalsLayout = (typeof totalsLayouts)[number];

export const totalsEmphases = ['bold', 'accent-line', 'soft-accent'] as const;
export type TotalsEmphasis = (typeof totalsEmphases)[number];

export const depositStyles = ['plain', 'highlight', 'boxed', 'accent-edge'] as const;
export type DepositStyle = (typeof depositStyles)[number];

export const alignments = ['left', 'center', 'right'] as const;
export type Alignment = (typeof alignments)[number];

export const sectionIds = [
  'header',
  'business',
  'document-info',
  'bill-to',
  'items',
  'totals',
  'deposit',
  'payment',
  'notes',
  'terms',
  'footer',
] as const;
export type SectionId = (typeof sectionIds)[number];

export type SectionConfig = {
  id: SectionId;
  enabled: boolean;
};

export type ThemeConfig = {
  page: {
    size: PageSize;
    margin: MarginOption;
    backgroundColor: string;
    border: BorderOption;
  };
  brand: {
    logoSource?: string;
    logoSize?: LogoSize;
    primaryColor: string;
    secondaryColor?: string;
  };
  typography: {
    font: string;
    headingScale: HeadingScale;
  };
  header: { layout: HeaderLayout };
  billTo: { style: BillToStyle };
  items: {
    headerStyle: ItemHeaderStyle;
    rowStyle: ItemRowStyle;
    showQuantity: boolean;
    showRate: boolean;
    showTax: boolean;
  };
  totals: { layout: TotalsLayout; emphasis: TotalsEmphasis };
  deposit: { style: DepositStyle };
  footer: {
    alignment: Alignment;
    showBusinessName: boolean;
    showWebsite: boolean;
    showPageNumber: boolean;
    customText?: string;
    showDivider: boolean;
  };
  sections: SectionConfig[];
};
