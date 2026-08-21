"use client";

import { createTheme, alpha } from "@mui/material/styles";
import {
  invoiceFlowDesignTokens,
  type InvoiceFlowDesignTokens,
} from "@invoiceflow/design-tokens";

export function createInvoiceFlowTheme(
  tokens: InvoiceFlowDesignTokens = invoiceFlowDesignTokens,
) {
  const c = tokens.color;
  const shadow = "0 18px 50px rgba(16,24,40,.14)";

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
      primary: { main: c.primary, dark: c.primaryHover, light: c.primarySoft },
      background: { default: c.background, paper: c.surface },
      text: { primary: c.textPrimary, secondary: c.textSecondary, disabled: c.textMuted },
      divider: c.border,
      success: { main: c.success, light: c.successSoft },
      warning: { main: c.warning, light: c.warningSoft },
      error: { main: c.danger, light: c.dangerSoft },
    },
    shape: { borderRadius: 9 },
    typography: {
      fontFamily: `'${tokens.typography.family}', ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
      h1: { fontSize: 28, fontWeight: 800, letterSpacing: "-.035em" },
      h2: { fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" },
      h3: { fontSize: tokens.typography.total.size, fontWeight: 800 },
      h4: { fontSize: 25, fontWeight: 800, letterSpacing: "-.035em" },
      h5: { fontSize: 18, fontWeight: 800 },
      h6: { fontSize: 16, fontWeight: 800 },
      body1: { fontSize: 14, fontWeight: 400 },
      body2: { fontSize: 13, fontWeight: 400 },
      subtitle1: { fontSize: 14, fontWeight: 700 },
      subtitle2: { fontSize: tokens.typography.label.size, fontWeight: 700, color: c.textSecondary },
      caption: { fontSize: 11, fontWeight: 400, color: c.textSecondary },
      button: { fontSize: 13, fontWeight: 750, textTransform: "none" },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "html, body": { minHeight: "100%" },
          body: {
            backgroundColor: c.background,
            color: c.textPrimary,
            fontFamily: `'${tokens.typography.family}', ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
          },
          ":focus-visible": {
            outline: "3px solid rgba(37,99,235,.22)",
            outlineOffset: 2,
          },
          ".money": { fontVariantNumeric: "tabular-nums" },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            height: 44,
            minWidth: 0,
            borderRadius: 9,
            padding: "0 17px",
            fontSize: 13,
            fontWeight: 750,
            letterSpacing: 0,
          },
          sizeSmall: { height: 36, padding: "0 13px", fontSize: 12 },
          contained: { backgroundColor: c.primary, color: "#fff", "&:hover": { backgroundColor: c.primaryHover } },
          outlined: { backgroundColor: c.surface, borderColor: c.borderStrong, color: c.textPrimary, "&:hover": { borderColor: c.borderStrong, backgroundColor: c.background } },
          text: { color: c.primary, fontWeight: 750 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            height: 22,
            fontSize: 11,
            fontWeight: 750,
            padding: "5px 9px",
          },
          label: { padding: 0 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 9,
            fontSize: 13,
            backgroundColor: c.surface,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: c.borderStrong },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: c.borderStrong },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: c.primary, borderWidth: 1 },
          },
          input: { height: 20, padding: "11px 12px" },
        },
      },
      MuiTextField: { styleOverrides: { root: { fontSize: 13 } } },
      MuiInputLabel: { styleOverrides: { root: { fontSize: 12, fontWeight: 700, color: c.textSecondary } } },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 14, border: `1px solid ${c.border}`, boxShadow: "none", backgroundColor: c.surface },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 14, backgroundImage: "none" },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16, boxShadow: shadow, color: c.textPrimary },
          root: { "& .MuiBackdrop-root": { backgroundColor: alpha("#101828", 0.42), backdropFilter: "blur(2px)" } },
        },
      },
      MuiTabs: { styleOverrides: { root: { minHeight: 34 } } },
      MuiTab: {
        styleOverrides: {
          root: {
            height: 34,
            minHeight: 34,
            borderRadius: 999,
            backgroundColor: "#F2F4F7",
            color: c.textSecondary,
            fontSize: 12,
            fontWeight: 700,
            padding: "0 12px",
            textTransform: "none",
            marginRight: 8,
            "&.Mui-selected": { backgroundColor: c.primarySoft, color: c.primary },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": { backgroundColor: "#FCFCFD" },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: c.border, fontSize: 13 },
          head: { backgroundColor: "#FCFCFD", color: c.textSecondary, fontSize: 11, fontWeight: 800 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 650,
            color: c.textSecondary,
            "&.Mui-selected": { backgroundColor: c.primarySoft, color: c.primary },
            "&.Mui-selected:hover": { backgroundColor: c.primarySoft },
          },
        },
      },
      MuiMenuItem: { styleOverrides: { root: { fontSize: 13 } } },
    },
  });
}

export const invoiceFlowTheme = createInvoiceFlowTheme();
