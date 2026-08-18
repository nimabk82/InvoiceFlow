import assert from 'node:assert/strict';
import test from 'node:test';

import { invoiceFlowDesignTokens } from '../dist/index.js';

test('exports a coherent cross-platform token contract', () => {
  const tokens = invoiceFlowDesignTokens;

  assert.equal(tokens.spacing[0], 4);
  assert.equal(tokens.breakpoints.mobileMax + 1, tokens.breakpoints.tabletMin);
  assert.equal(tokens.breakpoints.tabletMax + 1, tokens.breakpoints.desktopMin);
  assert.ok(tokens.sizing.minimumTouchTarget >= 44);
});
