"use client";

import { createTheme } from "@mui/material/styles";

import {
  invoiceFlowDesignTokens,
  type InvoiceFlowDesignTokens,
} from "./design-tokens";

export function createInvoiceFlowTheme(
  tokens: InvoiceFlowDesignTokens = invoiceFlowDesignTokens,
) {
  return createTheme({
    cssVariables: true,
    spacing: tokens.spacingUnit,
    breakpoints: {
      values: {
        xs: 0,
        sm: tokens.breakpoints.tablet,
        md: tokens.breakpoints.desktop,
        lg: 1440,
        xl: 1920,
      },
    },
    palette: {
      mode: "light",
      primary: {
        main: tokens.color.primary,
        dark: tokens.color.primaryHover,
        light: tokens.color.primarySoft,
      },
      background: {
        default: tokens.color.background,
        paper: tokens.color.surface,
      },
      text: {
        primary: tokens.color.textPrimary,
        secondary: tokens.color.textSecondary,
        disabled: tokens.color.textMuted,
      },
      divider: tokens.color.border,
      success: {
        main: tokens.color.success,
      },
      warning: {
        main: tokens.color.warning,
      },
      error: {
        main: tokens.color.danger,
      },
    },
    shape: {
      borderRadius: tokens.radius.control,
    },
    typography: {
      fontFamily: `${tokens.typography.family}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
      h1: {
        fontSize: tokens.typography.pageTitle.size,
        fontWeight: tokens.typography.pageTitle.weight,
      },
      h2: {
        fontSize: tokens.typography.sectionTitle.size,
        fontWeight: tokens.typography.sectionTitle.weight,
      },
      body1: {
        fontSize: tokens.typography.body.size,
        fontWeight: tokens.typography.body.weight,
      },
      caption: {
        fontSize: tokens.typography.meta.size,
        fontWeight: tokens.typography.meta.weight,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            minHeight: tokens.sizing.desktopControl,
            textTransform: "none",
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.color.background,
          },
        },
      },
    },
  });
}

export const invoiceFlowTheme = createInvoiceFlowTheme();
