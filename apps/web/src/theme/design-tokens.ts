/**
 * Web theme token boundary.
 *
 * PLATFORM-05 will source this contract from `@invoiceflow/design-tokens`.
 * Keeping MUI configuration dependent on this single adapter prevents token
 * values from being scattered through application code in the meantime.
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
    success: string;
    warning: string;
    danger: string;
  }>;
  typography: Readonly<{
    family: string;
    pageTitle: Readonly<{ size: number; weight: number }>;
    sectionTitle: Readonly<{ size: number; weight: number }>;
    body: Readonly<{ size: number; weight: number }>;
    meta: Readonly<{ size: number; weight: number }>;
  }>;
  spacingUnit: number;
  radius: Readonly<{
    control: number;
  }>;
  breakpoints: Readonly<{
    tablet: number;
    desktop: number;
  }>;
  sizing: Readonly<{
    desktopControl: number;
  }>;
}>;

export const invoiceFlowDesignTokens: InvoiceFlowDesignTokens = {
  color: {
    primary: "#2563EB",
    primaryHover: "#1D4ED8",
    primarySoft: "#EFF6FF",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    textPrimary: "#101828",
    textSecondary: "#667085",
    textMuted: "#98A2B3",
    border: "#E4E7EC",
    success: "#15803D",
    warning: "#B45309",
    danger: "#B42318",
  },
  typography: {
    family: "Inter",
    pageTitle: { size: 28, weight: 700 },
    sectionTitle: { size: 18, weight: 600 },
    body: { size: 14, weight: 400 },
    meta: { size: 12, weight: 400 },
  },
  spacingUnit: 4,
  radius: {
    control: 8,
  },
  breakpoints: {
    tablet: 768,
    desktop: 1200,
  },
  sizing: {
    desktopControl: 44,
  },
};
