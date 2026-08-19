export type ValidationSeverity = 'error' | 'warning';

export type ValidationIssue = Readonly<{
  code: string;
  message: string;
  severity: ValidationSeverity;
  path?: string;
}>;

export type ValidationResult = Readonly<{
  valid: boolean;
  issues: readonly ValidationIssue[];
}>;

export function isDecimal(value: string): boolean {
  return /^\d*\.?\d+$/.test(value.trim());
}

export function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
