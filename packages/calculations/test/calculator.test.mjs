import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateDocumentTotals, calculatePaidBalance } from '../dist/index.js';

test('calculates subtotal, tax, and total for a single item', () => {
  const totals = calculateDocumentTotals({
    currencyCode: 'USD',
    items: [
      {
        quantity: '1',
        rate: '5000',
        appliedTaxes: [{ name: 'GST', rate: '13' }],
      },
    ],
  });

  assert.equal(totals.subtotal.toDecimalString(), '5000.00');
  assert.equal(totals.taxTotal.toDecimalString(), '650.00');
  assert.equal(totals.total.toDecimalString(), '5650.00');
});

test('matches the product deposit example', () => {
  const totals = calculateDocumentTotals({
    currencyCode: 'USD',
    items: [
      {
        quantity: '1',
        rate: '5000',
        appliedTaxes: [{ name: 'Tax', rate: '13' }],
      },
    ],
    depositTerms: { type: 'percentage', value: '30' },
  });

  assert.equal(totals.subtotal.toDecimalString(), '5000.00');
  assert.equal(totals.taxTotal.toDecimalString(), '650.00');
  assert.equal(totals.total.toDecimalString(), '5650.00');
  assert.equal(totals.deposit.required.toDecimalString(), '1695.00');
  assert.equal(totals.deposit.remaining.toDecimalString(), '3955.00');
});

test('applies a percentage discount before tax', () => {
  const totals = calculateDocumentTotals({
    currencyCode: 'USD',
    items: [
      {
        quantity: '2',
        rate: '100',
        appliedTaxes: [{ name: 'GST', rate: '10' }],
      },
    ],
    discount: { type: 'percentage', value: '10' },
  });

  assert.equal(totals.subtotal.toDecimalString(), '200.00');
  assert.equal(totals.discountAmount.toDecimalString(), '20.00');
  assert.equal(totals.taxableSubtotal.toDecimalString(), '180.00');
  assert.equal(totals.taxTotal.toDecimalString(), '18.00');
  assert.equal(totals.total.toDecimalString(), '198.00');
});

test('supports a fixed deposit and multiple tax components', () => {
  const totals = calculateDocumentTotals({
    currencyCode: 'USD',
    items: [
      {
        quantity: '1',
        rate: '100',
        appliedTaxes: [
          { name: 'GST', rate: '5' },
          { name: 'PST', rate: '7' },
        ],
      },
    ],
    depositTerms: { type: 'fixed', value: '50' },
  });

  assert.equal(totals.taxTotal.toDecimalString(), '12.00');
  assert.equal(totals.total.toDecimalString(), '112.00');
  assert.equal(totals.deposit.required.toDecimalString(), '50.00');
  assert.equal(totals.deposit.remaining.toDecimalString(), '62.00');
});

test('computes paid and balance for payments', () => {
  const total = calculateDocumentTotals({
    currencyCode: 'USD',
    items: [{ quantity: '1', rate: '100', appliedTaxes: [] }],
  }).total;
  const { paid, balance } = calculatePaidBalance(total, [
    { amount: '40' },
    { amount: '10' },
  ]);

  assert.equal(paid.toDecimalString(), '50.00');
  assert.equal(balance.toDecimalString(), '50.00');
});
