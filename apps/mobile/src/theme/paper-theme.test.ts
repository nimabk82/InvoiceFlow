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
  });
});
