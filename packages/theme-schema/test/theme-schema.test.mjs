import assert from 'node:assert/strict';
import test from 'node:test';

import { validateThemeConfig } from '../dist/index.js';

const validConfig = {
  page: { size: 'letter', margin: 'standard', backgroundColor: '#ffffff', border: 'none' },
  brand: { primaryColor: '#1a1a2e', secondaryColor: '#e0e0e0' },
  typography: { font: 'Inter', headingScale: 'comfortable' },
  header: { layout: 'classic' },
  billTo: { style: 'plain' },
  items: { headerStyle: 'line', rowStyle: 'plain', showQuantity: true, showRate: true, showTax: true },
  totals: { layout: 'right', emphasis: 'bold' },
  deposit: { style: 'plain' },
  footer: { alignment: 'right', showBusinessName: true, showWebsite: true, showPageNumber: true, showDivider: true },
  sections: [
    { id: 'header', enabled: true },
    { id: 'items', enabled: true },
    { id: 'totals', enabled: true },
    { id: 'deposit', enabled: true },
    { id: 'footer', enabled: true },
  ],
};

test('accepts a valid theme config', () => {
  const result = validateThemeConfig(validConfig);
  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
});

test('rejects an invalid color', () => {
  const result = validateThemeConfig({
    ...validConfig,
    brand: { ...validConfig.brand, primaryColor: 'blue' },
  });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'invalid_color'));
});

test('rejects an invalid enum value', () => {
  const result = validateThemeConfig({
    ...validConfig,
    page: { ...validConfig.page, size: 'tabloid' },
  });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'invalid_value'));
});

test('rejects invalid section order (deposit before totals)', () => {
  const result = validateThemeConfig({
    ...validConfig,
    sections: [
      { id: 'header', enabled: true },
      { id: 'items', enabled: true },
      { id: 'deposit', enabled: true },
      { id: 'totals', enabled: true },
      { id: 'footer', enabled: true },
    ],
  });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'invalid_section_order'));
});

test('rejects footer that is not last', () => {
  const result = validateThemeConfig({
    ...validConfig,
    sections: [
      { id: 'footer', enabled: true },
      { id: 'header', enabled: true },
      { id: 'items', enabled: true },
      { id: 'totals', enabled: true },
      { id: 'deposit', enabled: true },
    ],
  });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'footer_not_last'));
});
