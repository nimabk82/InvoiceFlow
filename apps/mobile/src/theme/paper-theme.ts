import {
  configureFonts,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';
import {
  invoiceFlowDesignTokens,
  type InvoiceFlowDesignTokens,
} from '@invoiceflow/design-tokens';

type PaperFontWeight =
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

export function createInvoiceFlowPaperTheme(
  tokens: InvoiceFlowDesignTokens = invoiceFlowDesignTokens,
): MD3Theme {
  const fontWeight = (weight: number): PaperFontWeight =>
    String(weight) as PaperFontWeight;

  return {
    ...MD3LightTheme,
    roundness: tokens.radius.control,
    fonts: configureFonts({
      config: {
        headlineLarge: {
          fontFamily: tokens.typography.family,
          fontSize: tokens.typography.pageTitle.size,
          fontWeight: fontWeight(tokens.typography.pageTitle.weight),
        },
        headlineSmall: {
          fontFamily: tokens.typography.family,
          fontSize: tokens.typography.total.size,
          fontWeight: fontWeight(tokens.typography.total.weight),
        },
        titleLarge: {
          fontFamily: tokens.typography.family,
          fontSize: tokens.typography.sectionTitle.size,
          fontWeight: fontWeight(tokens.typography.sectionTitle.weight),
        },
        bodyMedium: {
          fontFamily: tokens.typography.family,
          fontSize: tokens.typography.body.size,
          fontWeight: fontWeight(tokens.typography.body.weight),
        },
        labelLarge: {
          fontFamily: tokens.typography.family,
          fontSize: tokens.typography.label.size,
          fontWeight: fontWeight(tokens.typography.label.weight),
        },
        labelSmall: {
          fontFamily: tokens.typography.family,
          fontSize: tokens.typography.meta.size,
          fontWeight: fontWeight(tokens.typography.meta.weight),
        },
      },
    }),
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
      inversePrimary: tokens.color.primarySoft,
    },
  };
}

export const invoiceFlowPaperTheme = createInvoiceFlowPaperTheme();
