/**
 * Mobile theme token boundary.
 *
 * PLATFORM-05 will source this contract from `@invoiceflow/design-tokens`.
 * Paper and navigation depend on this adapter so token values do not spread
 * into application or feature code.
 */
export type InvoiceFlowDesignTokens = Readonly<{
  color: Readonly<{
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
  typography: Readonly<{
    family: string;
    pageTitle: Readonly<{ size: number; weight: number }>;
    sectionTitle: Readonly<{ size: number; weight: number }>;
    body: Readonly<{ size: number; weight: number }>;
    label: Readonly<{ size: number; weight: number }>;
    meta: Readonly<{ size: number; weight: number }>;
  }>;
  radius: Readonly<{
    control: number;
  }>;
}>;

export const invoiceFlowDesignTokens: InvoiceFlowDesignTokens = {
  color: {
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
  },
  typography: {
    family: 'Inter',
    pageTitle: { size: 28, weight: 700 },
    sectionTitle: { size: 18, weight: 600 },
    body: { size: 14, weight: 400 },
    label: { size: 13, weight: 500 },
    meta: { size: 12, weight: 400 },
  },
  radius: {
    control: 8,
  },
};
