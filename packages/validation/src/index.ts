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
  return (
    typeof value === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
}

export type DocumentEditItem = Readonly<{
  quantity?: string;
  rate?: string;
}>;

export type DocumentEditInput = Readonly<{
  items: readonly DocumentEditItem[];
}>;

export type DocumentReviewItem = Readonly<{
  rate?: string;
}>;

export type DocumentReviewInput = Readonly<{
  clientSelected: boolean;
  items: readonly DocumentReviewItem[];
}>;

export type DocumentSendInput = Readonly<{
  to: readonly string[];
}>;

export type FinalDocumentSendInput = Readonly<{
  clientSelected: boolean;
  items: readonly Readonly<{
    description?: string;
    quantity?: string;
    rate?: string;
  }>[];
  themeId?: string;
  themeVersionId?: string;
  to: readonly string[];
  cc?: readonly string[];
  bcc?: readonly string[];
}>;

export function validateDocumentForEdit(
  input: DocumentEditInput,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  input.items.forEach((item, index) => {
    if (
      item.quantity !== undefined &&
      item.quantity.trim() !== '' &&
      !isDecimal(item.quantity)
    ) {
      issues.push({
        code: 'invalid_quantity',
        message: 'Enter a valid quantity.',
        severity: 'error',
        path: `items[${index}].quantity`,
      });
    }

    if (
      item.rate !== undefined &&
      item.rate.trim() !== '' &&
      !isDecimal(item.rate)
    ) {
      issues.push({
        code: 'invalid_rate',
        message: 'Enter a valid rate.',
        severity: 'error',
        path: `items[${index}].rate`,
      });
    }
  });

  return { valid: issues.length === 0, issues };
}

export function validateDocumentForReview(
  input: DocumentReviewInput,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!input.clientSelected) {
    issues.push({
      code: 'client_required',
      message: 'Select a client.',
      severity: 'error',
      path: 'client',
    });
  }

  if (input.items.length === 0) {
    issues.push({
      code: 'item_required',
      message: 'Add at least one invoice item.',
      severity: 'error',
      path: 'items',
    });
  }

  input.items.forEach((item, index) => {
    if (item.rate === undefined || item.rate.trim() === '') {
      issues.push({
        code: 'rate_required',
        message: 'Enter a rate.',
        severity: 'error',
        path: `items[${index}].rate`,
      });
    } else if (!isDecimal(item.rate)) {
      issues.push({
        code: 'invalid_rate',
        message: 'Enter a valid rate.',
        severity: 'error',
        path: `items[${index}].rate`,
      });
    }
  });

  return { valid: issues.length === 0, issues };
}

export function validateDocumentForSend(
  input: DocumentSendInput,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const email of input.to) {
    if (!validateEmail(email)) {
      issues.push({
        code: 'invalid_email',
        message: 'Invalid email address.',
        severity: 'error',
        path: 'to',
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

export function validateFinalDocumentForSend(
  input: FinalDocumentSendInput,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!input.clientSelected) {
    issues.push({
      code: 'client_required',
      message: 'Select a client.',
      severity: 'error',
      path: 'client',
    });
  }

  if (input.items.length === 0) {
    issues.push({
      code: 'item_required',
      message: 'Add at least one document item.',
      severity: 'error',
      path: 'items',
    });
  }

  input.items.forEach((item, index) => {
    if (!item.description?.trim()) {
      issues.push({
        code: 'description_required',
        message: 'Enter an item description.',
        severity: 'error',
        path: `items[${index}].description`,
      });
    }

    if (!item.quantity?.trim() || !isDecimal(item.quantity)) {
      issues.push({
        code: 'invalid_quantity',
        message: 'Enter a valid quantity.',
        severity: 'error',
        path: `items[${index}].quantity`,
      });
    } else if (!/[1-9]/.test(item.quantity)) {
      issues.push({
        code: 'nonpositive_quantity',
        message: 'Quantity must be greater than zero.',
        severity: 'error',
        path: `items[${index}].quantity`,
      });
    }

    const rate = item.rate?.trim();
    if (rate?.startsWith('-') && isDecimal(rate.slice(1))) {
      issues.push({
        code: 'negative_rate',
        message: 'Rate cannot be negative.',
        severity: 'error',
        path: `items[${index}].rate`,
      });
    } else if (!rate || !isDecimal(rate)) {
      issues.push({
        code: 'invalid_rate',
        message: 'Enter a valid rate.',
        severity: 'error',
        path: `items[${index}].rate`,
      });
    }
  });

  if (!input.themeId?.trim() || !input.themeVersionId?.trim()) {
    issues.push({
      code: 'theme_required',
      message: 'Select a theme and theme version.',
      severity: 'error',
      path: 'theme',
    });
  }

  if (input.to.length === 0) {
    issues.push({
      code: 'recipient_required',
      message: 'Add at least one To recipient.',
      severity: 'error',
      path: 'to',
    });
  }

  for (const [field, emails] of [
    ['to', input.to],
    ['cc', input.cc ?? []],
    ['bcc', input.bcc ?? []],
  ] as const) {
    emails.forEach((email, index) => {
      if (!validateEmail(email)) {
        issues.push({
          code: 'invalid_email',
          message: `Invalid email address: ${email}`,
          severity: 'error',
          path: `${field}[${index}]`,
        });
      }
    });
  }

  return { valid: issues.length === 0, issues };
}
