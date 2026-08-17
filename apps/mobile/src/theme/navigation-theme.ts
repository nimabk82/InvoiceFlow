import {
  DefaultTheme as NavigationDefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import { invoiceFlowPaperTheme } from './paper-theme';

export const invoiceFlowNavigationTheme: NavigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: invoiceFlowPaperTheme.colors.primary,
    background: invoiceFlowPaperTheme.colors.background,
    card: invoiceFlowPaperTheme.colors.surface,
    text: invoiceFlowPaperTheme.colors.onSurface,
    border: invoiceFlowPaperTheme.colors.outline,
    notification: invoiceFlowPaperTheme.colors.error,
  },
};
