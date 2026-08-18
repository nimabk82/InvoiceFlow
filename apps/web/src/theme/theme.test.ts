import { describe, expect, it } from "vitest";

import { createInvoiceFlowTheme, invoiceFlowDesignTokens } from "./index";

describe("createInvoiceFlowTheme", () => {
  it("maps the design-token boundary into the MUI theme", () => {
    const theme = createInvoiceFlowTheme(invoiceFlowDesignTokens);

    expect(theme.palette.primary.main).toBe(
      invoiceFlowDesignTokens.color.primary,
    );
    expect(theme.palette.background.default).toBe(
      invoiceFlowDesignTokens.color.background,
    );
    expect(theme.breakpoints.values.sm).toBe(
      invoiceFlowDesignTokens.breakpoints.tabletMin,
    );
    expect(theme.breakpoints.values.md).toBe(
      invoiceFlowDesignTokens.breakpoints.desktopMin,
    );
    expect(theme.palette.success.light).toBe(
      invoiceFlowDesignTokens.color.successSoft,
    );
    expect(theme.typography.h3.fontSize).toBe(
      invoiceFlowDesignTokens.typography.total.size,
    );
    expect(theme.typography.subtitle2.fontSize).toBe(
      invoiceFlowDesignTokens.typography.label.size,
    );
  });
});
