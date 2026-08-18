import {
  createInvoiceFlowPaperTheme,
  invoiceFlowDesignTokens,
} from './index';

describe('createInvoiceFlowPaperTheme', () => {
  it('maps the design-token boundary into the Paper theme', () => {
    const theme = createInvoiceFlowPaperTheme(invoiceFlowDesignTokens);

    expect(theme.colors.primary).toBe(invoiceFlowDesignTokens.color.primary);
    expect(theme.colors.background).toBe(
      invoiceFlowDesignTokens.color.background,
    );
    expect(theme.colors.onSurface).toBe(
      invoiceFlowDesignTokens.color.textPrimary,
    );
    expect(theme.roundness).toBe(invoiceFlowDesignTokens.radius.control);
    expect(theme.fonts.headlineLarge.fontFamily).toBe(
      invoiceFlowDesignTokens.typography.family,
    );
    expect(theme.fonts.headlineLarge.fontSize).toBe(
      invoiceFlowDesignTokens.typography.pageTitle.size,
    );
    expect(theme.fonts.headlineSmall.fontSize).toBe(
      invoiceFlowDesignTokens.typography.total.size,
    );
    expect(theme.colors.inversePrimary).toBe(
      invoiceFlowDesignTokens.color.primarySoft,
    );
  });
});
