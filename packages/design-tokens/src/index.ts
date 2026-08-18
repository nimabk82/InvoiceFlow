export type ColorTokens = Readonly<{
  primary: string;
  primaryHover: string;
  primarySoft: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
}>;

export type TypographyStyle = Readonly<{
  size: number;
  weight: number;
}>;

export type TypographyTokens = Readonly<{
  family: string;
  pageTitle: TypographyStyle;
  sectionTitle: TypographyStyle;
  body: TypographyStyle;
  label: TypographyStyle;
  meta: TypographyStyle;
  total: TypographyStyle;
}>;

export type RadiusTokens = Readonly<{
  small: number;
  control: number;
  card: number;
  modal: number;
}>;

export type BreakpointTokens = Readonly<{
  mobileMax: number;
  tabletMin: number;
  tabletMax: number;
  desktopMin: number;
}>;

export type SizingTokens = Readonly<{
  desktopControl: number;
  mobilePrimaryAction: number;
  minimumTouchTarget: number;
}>;

export type InvoiceFlowDesignTokens = Readonly<{
  color: ColorTokens;
  typography: TypographyTokens;
  spacing: readonly number[];
  radius: RadiusTokens;
  breakpoints: BreakpointTokens;
  sizing: SizingTokens;
}>;

export const colors = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primarySoft: '#EFF6FF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#101828',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  border: '#E4E7EC',
  borderStrong: '#D0D5DD',
  success: '#15803D',
  successSoft: '#ECFDF3',
  warning: '#B45309',
  warningSoft: '#FFFAEB',
  danger: '#B42318',
  dangerSoft: '#FEF3F2',
} as const satisfies ColorTokens;

export const typography = {
  family: 'Inter',
  pageTitle: { size: 28, weight: 700 },
  sectionTitle: { size: 18, weight: 600 },
  body: { size: 14, weight: 400 },
  label: { size: 13, weight: 500 },
  meta: { size: 12, weight: 400 },
  total: { size: 24, weight: 700 },
} as const satisfies TypographyTokens;

export const spacing = [4, 8, 12, 16, 24, 32, 40, 48, 64] as const;

export const radius = {
  small: 6,
  control: 8,
  card: 12,
  modal: 16,
} as const satisfies RadiusTokens;

export const breakpoints = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1199,
  desktopMin: 1200,
} as const satisfies BreakpointTokens;

export const sizing = {
  desktopControl: 44,
  mobilePrimaryAction: 50,
  minimumTouchTarget: 44,
} as const satisfies SizingTokens;

export const invoiceFlowDesignTokens = {
  color: colors,
  typography,
  spacing,
  radius,
  breakpoints,
  sizing,
} as const satisfies InvoiceFlowDesignTokens;
