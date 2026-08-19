import assert from 'node:assert/strict';
import test from 'node:test';

import {
  autosaveReducer,
  initialSaveState,
} from '../dist/index.js';

test('starts in the idle state', () => {
  assert.deepEqual(initialSaveState(), { state: 'idle' });
});

test('idle -> saving -> saved', () => {
  const saving = autosaveReducer(initialSaveState(), { type: 'SAVE_REQUESTED' });
  assert.deepEqual(saving, { state: 'saving' });

  const saved = autosaveReducer(saving, {
    type: 'SAVE_SUCCEEDED',
    savedAt: '2026-08-19T00:00:00.000Z',
  });
  assert.deepEqual(saved, { state: 'saved', savedAt: '2026-08-19T00:00:00.000Z' });
});

test('saving -> error records retryable', () => {
  const saving = autosaveReducer(initialSaveState(), { type: 'SAVE_REQUESTED' });
  const error = autosaveReducer(saving, { type: 'SAVE_FAILED', retryable: true });

  assert.deepEqual(error, { state: 'error', retryable: true });
});

test('error -> saving retries, and reset returns to idle', () => {
  const error = autosaveReducer(initialSaveState(), { type: 'SAVE_FAILED', retryable: true });
  const retry = autosaveReducer(error, { type: 'SAVE_REQUESTED' });
  assert.deepEqual(retry, { state: 'saving' });

  assert.deepEqual(autosaveReducer(error, { type: 'RESET' }), { state: 'idle' });
});
