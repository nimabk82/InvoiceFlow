import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

import {
  invoiceFlowDesignTokens,
  type InvoiceFlowDesignTokens,
} from './design-tokens';

export function createInvoiceFlowPaperTheme(
  tokens: InvoiceFlowDesignTokens = invoiceFlowDesignTokens,
): MD3Theme {
  return {
    ...MD3LightTheme,
    roundness: tokens.radius.control,
    colors: {
      ...MD3LightTheme.colors,
      primary: tokens.color.primary,
      onPrimary: tokens.color.surface,
      primaryContainer: tokens.color.primarySoft,
      onPrimaryContainer: tokens.color.primaryHover,
      background: tokens.color.background,
      onBackground: tokens.color.textPrimary,
      surface: tokens.color.surface,
      onSurface: tokens.color.textPrimary,
      surfaceVariant: tokens.color.primarySoft,
      onSurfaceVariant: tokens.color.textSecondary,
      outline: tokens.color.borderStrong,
      outlineVariant: tokens.color.border,
      error: tokens.color.danger,
      onError: tokens.color.surface,
      errorContainer: tokens.color.dangerSoft,
      onErrorContainer: tokens.color.danger,
    },
  };
}

export const invoiceFlowPaperTheme = createInvoiceFlowPaperTheme();
