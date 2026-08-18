"use client";

import { createTheme } from "@mui/material/styles";
import {
  invoiceFlowDesignTokens,
  type InvoiceFlowDesignTokens,
} from "@invoiceflow/design-tokens";

export function createInvoiceFlowTheme(
  tokens: InvoiceFlowDesignTokens = invoiceFlowDesignTokens,
) {
  return createTheme({
    cssVariables: true,
    spacing: tokens.spacing[0],
    breakpoints: {
      values: {
        xs: 0,
        sm: tokens.breakpoints.tabletMin,
        md: tokens.breakpoints.desktopMin,
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
        light: tokens.color.successSoft,
      },
      warning: {
        main: tokens.color.warning,
        light: tokens.color.warningSoft,
      },
      error: {
        main: tokens.color.danger,
        light: tokens.color.dangerSoft,
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
      h3: {
        fontSize: tokens.typography.total.size,
        fontWeight: tokens.typography.total.weight,
      },
      body1: {
        fontSize: tokens.typography.body.size,
        fontWeight: tokens.typography.body.weight,
      },
      subtitle2: {
        fontSize: tokens.typography.label.size,
        fontWeight: tokens.typography.label.weight,
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
            borderRadius: tokens.radius.control,
            textTransform: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.card,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.color.background,
            color: tokens.color.textPrimary,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: tokens.radius.modal,
          },
        },
      },
    },
  });
}

export const invoiceFlowTheme = createInvoiceFlowTheme();
