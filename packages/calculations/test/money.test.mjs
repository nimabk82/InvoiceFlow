import assert from 'node:assert/strict';
import test from 'node:test';

import { Decimal, Money } from '../dist/index.js';

test('Decimal.fromString parses decimal strings exactly', () => {
  assert.equal(Decimal.fromString('5000.00').toString(), '5000');
  assert.equal(Decimal.fromString('0.08').toString(), '0.08');
  assert.equal(Decimal.fromString('1.50').toString(), '1.5');
  assert.equal(Decimal.fromString('-12.345').toString(), '-12.345');
  assert.equal(Decimal.fromString('100').toString(), '100');
});

test('Decimal addition does not use binary floats', () => {
  const result = Decimal.fromString('0.1').add(Decimal.fromString('0.2'));
  assert.equal(result.toString(), '0.3');
});

test('Decimal multiplication and division round half away from zero', () => {
  assert.equal(Decimal.fromString('2.5').multiply(Decimal.fromString('2')).toString(), '5');
  assert.equal(Decimal.fromString('1').divide(Decimal.fromString('3'), 2).toString(), '0.33');
  assert.equal(Decimal.fromString('-1').divide(Decimal.fromString('3'), 2).toString(), '-0.33');
  assert.equal(Decimal.fromString('0.005').round(2).toString(), '0.01');
  assert.equal(Decimal.fromString('0.004').round(2).toString(), '0');
});

test('Money parses and formats at a fixed scale', () => {
  const money = Money.fromDecimalString('1695', 'USD');
  assert.equal(money.toDecimalString(), '1695.00');
  assert.equal(money.toMinorUnits(), 169500n);
});

test('Money supports add, subtract, and percent arithmetic', () => {
  const a = Money.fromDecimalString('5000', 'USD');
  const tax = a.percentOf(Decimal.fromString('13'));
  assert.equal(tax.toDecimalString(), '650.00');
  assert.equal(a.subtract(tax).toDecimalString(), '4350.00');
});

test('Money enforces currency and scale consistency', () => {
  const usd = Money.fromDecimalString('1', 'USD');
  const eur = Money.fromDecimalString('1', 'EUR');
  assert.throws(() => usd.add(eur));
});
