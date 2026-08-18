import assert from 'node:assert/strict';
import test from 'node:test';

import {
  breakpoints,
  colors,
  invoiceFlowDesignTokens,
  radius,
  sizing,
  spacing,
  typography,
} from '../dist/index.js';

test('exports the finalized InvoiceFlow token families', () => {
  assert.deepEqual(colors, {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primarySoft: '#EFF6FF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    textPrimary: '#101828',
    textSecondary: '#667085',
    textMuted: '#98A2B3',
    border: '#E4E7EC',
    borderStrong: '#D0D5DD',
    success: '#15803D',
    successSoft: '#ECFDF3',
    warning: '#B45309',
    warningSoft: '#FFFAEB',
    danger: '#B42318',
    dangerSoft: '#FEF3F2',
  });
  assert.deepEqual(typography, {
    family: 'Inter',
    pageTitle: { size: 28, weight: 700 },
    sectionTitle: { size: 18, weight: 600 },
    body: { size: 14, weight: 400 },
    label: { size: 13, weight: 500 },
    meta: { size: 12, weight: 400 },
    total: { size: 24, weight: 700 },
  });
  assert.deepEqual(spacing, [4, 8, 12, 16, 24, 32, 40, 48, 64]);
  assert.deepEqual(radius, { small: 6, control: 8, card: 12, modal: 16 });
  assert.deepEqual(breakpoints, {
    mobileMax: 767,
    tabletMin: 768,
    tabletMax: 1199,
    desktopMin: 1200,
  });
  assert.deepEqual(sizing, {
    desktopControl: 44,
    mobilePrimaryAction: 50,
    minimumTouchTarget: 44,
  });
});

test('composes the individual families into one cross-platform contract', () => {
  assert.deepEqual(invoiceFlowDesignTokens, {
    color: colors,
    typography,
    spacing,
    radius,
    breakpoints,
    sizing,
  });
  assert.equal(breakpoints.mobileMax + 1, breakpoints.tabletMin);
  assert.equal(breakpoints.tabletMax + 1, breakpoints.desktopMin);
  assert.ok(sizing.minimumTouchTarget >= 44);
});
