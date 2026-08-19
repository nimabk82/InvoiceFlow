import type { ValidationIssue, ValidationResult } from './validation.js';
import { isDecimal, validateEmail } from './validation.js';

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
