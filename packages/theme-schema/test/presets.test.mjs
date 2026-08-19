import assert from 'node:assert/strict';
import test from 'node:test';

import {
  themePresetNames,
  themePresets,
  validateThemeConfig,
} from '../dist/index.js';

test('exposes the four built-in presets', () => {
  assert.deepEqual(themePresetNames, ['clean', 'modern', 'minimal', 'blank']);
});

test('every preset is a valid theme config', () => {
  for (const name of themePresetNames) {
    const result = validateThemeConfig(themePresets[name]);
    assert.equal(
      result.valid,
      true,
      `${name} preset should validate; got ${JSON.stringify(result.issues)}`,
    );
  }
});
