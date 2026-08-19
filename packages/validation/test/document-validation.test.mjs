import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateDocumentForEdit,
  validateDocumentForReview,
  validateDocumentForSend,
  validateEmail,
} from '../dist/index.js';

test('validateEmail accepts valid and rejects invalid addresses', () => {
  assert.equal(validateEmail('a@b.com'), true);
  assert.equal(validateEmail('a@b'), false);
  assert.equal(validateEmail('a b@c.com'), false);
});

test('edit validation flags an invalid rate', () => {
  const result = validateDocumentForEdit({
    items: [{ quantity: '1', rate: 'abc' }],
  });
  assert.equal(result.valid, false);
  assert.equal(result.issues[0].code, 'invalid_rate');
});

test('review blocks when no client is selected', () => {
  const result = validateDocumentForReview({
    clientSelected: false,
    items: [{ rate: '100' }],
  });
  assert.equal(result.valid, false);
  assert.equal(result.issues[0].code, 'client_required');
});

test('review blocks when there are no items', () => {
  const result = validateDocumentForReview({
    clientSelected: true,
    items: [],
  });
  assert.equal(result.valid, false);
  assert.equal(result.issues[0].code, 'item_required');
});

test('review blocks when a rate is missing', () => {
  const result = validateDocumentForReview({
    clientSelected: true,
    items: [{ rate: undefined }],
  });
  assert.equal(result.valid, false);
  assert.equal(result.issues[0].code, 'rate_required');
});

test('review passes for a complete document', () => {
  const result = validateDocumentForReview({
    clientSelected: true,
    items: [{ rate: '100' }],
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
});

test('send validation rejects invalid recipient emails', () => {
  const result = validateDocumentForSend({
    to: ['ok@example.com', 'not-an-email'],
  });
  assert.equal(result.valid, false);
  assert.equal(result.issues[0].code, 'invalid_email');
});
