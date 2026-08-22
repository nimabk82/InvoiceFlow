// Jest-only shim for @invoiceflow/theme-schema (ESM dist is untransformable in ts-jest).
export const themePresets = {
  clean: {},
  modern: {},
  minimal: {},
  blank: {},
} as Record<string, Record<string, unknown>>;

export const themePresetNames = Object.keys(themePresets);

export function validateThemeConfig() {
  return { valid: true, issues: [] };
}
