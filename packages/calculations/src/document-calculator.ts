import { Decimal } from './decimal.js';
import { Money } from './money.js';

export type CalculatorItem = Readonly<{
  quantity: string;
  rate: string;
  appliedTaxes: readonly Readonly<{ name: string; rate: string }>[];
}>;

export type CalculatorDiscount = Readonly<
  | { type: 'percentage'; value: string }
  | { type: 'fixed'; value: string }
>;

export type CalculatorDepositTerms = Readonly<
  | { type: 'percentage'; value: string }
  | { type: 'fixed'; value: string }
>;

export type DocumentCalculationInput = Readonly<{
  currencyCode: string;
  scale?: number;
  items: readonly CalculatorItem[];
  discount?: CalculatorDiscount;
  depositTerms?: CalculatorDepositTerms;
}>;

export type TaxComponentTotal = Readonly<{
  name: string;
  rate: string;
  taxable: Money;
  amount: Money;
}>;

export type DepositResult = Readonly<
  | { type: 'percentage'; rate: string; required: Money; remaining: Money }
  | { type: 'fixed'; required: Money; remaining: Money }
>;

export type DocumentTotals = Readonly<{
  currencyCode: string;
  lineTotals: readonly Money[];
  subtotal: Money;
  discountAmount: Money;
  taxableSubtotal: Money;
  taxComponents: readonly TaxComponentTotal[];
  taxTotal: Money;
  total: Money;
  deposit: DepositResult | undefined;
}>;

export function calculateDocumentTotals(
  input: DocumentCalculationInput,
): DocumentTotals {
  const scale = input.scale ?? 2;
  const currency = input.currencyCode;
  const zero = Money.zero(currency, scale);

  const lineTotals = input.items.map((item) => {
    const quantity = Decimal.fromString(item.quantity);
    const rate = Money.fromDecimalString(item.rate, currency, scale);
    return rate.multiply(quantity);
  });

  const subtotal = lineTotals.reduce((sum, total) => sum.add(total), zero);

  const discountAmount = input.discount
    ? input.discount.type === 'fixed'
      ? Money.fromDecimalString(input.discount.value, currency, scale)
      : subtotal.percentOf(Decimal.fromString(input.discount.value))
    : zero;

  const taxableSubtotal = subtotal.subtract(discountAmount);

  const discountFactor = subtotal.isZero
    ? Decimal.fromString('1')
    : taxableSubtotal.divide(subtotal, 20);

  const taxByName = new Map<string, TaxComponentTotal>();

  input.items.forEach((item, index) => {
    const lineTotal = lineTotals[index] ?? Money.zero(currency, scale);
    const discountedLineTotal = lineTotal.multiply(discountFactor);

    for (const tax of item.appliedTaxes) {
      const existing = taxByName.get(tax.name) ?? {
        name: tax.name,
        rate: tax.rate,
        taxable: zero,
        amount: zero,
      };

      taxByName.set(tax.name, {
        ...existing,
        taxable: existing.taxable.add(discountedLineTotal),
        amount: existing.amount.add(
          discountedLineTotal.percentOf(Decimal.fromString(tax.rate)),
        ),
      });
    }
  });

  const taxComponents = [...taxByName.values()];
  const taxTotal = taxComponents.reduce(
    (sum, component) => sum.add(component.amount),
    zero,
  );

  const total = taxableSubtotal.add(taxTotal);

  const deposit = input.depositTerms
    ? buildDeposit(input.depositTerms, total, currency, scale)
    : undefined;

  return {
    currencyCode: currency,
    lineTotals,
    subtotal,
    discountAmount,
    taxableSubtotal,
    taxComponents,
    taxTotal,
    total,
    deposit,
  };
}

export function calculatePaidBalance(
  total: Money,
  payments: readonly { amount: string }[],
): Readonly<{ paid: Money; balance: Money }> {
  const paid = payments.reduce(
    (sum, payment) =>
      sum.add(Money.fromDecimalString(payment.amount, total.currencyCode, total.scale)),
    Money.zero(total.currencyCode, total.scale),
  );

  return { paid, balance: total.subtract(paid) };
}

function buildDeposit(
  terms: CalculatorDepositTerms,
  total: Money,
  currency: string,
  scale: number,
): DepositResult {
  const required =
    terms.type === 'fixed'
      ? Money.fromDecimalString(terms.value, currency, scale)
      : total.percentOf(Decimal.fromString(terms.value));

  const remaining = total.subtract(required);

  return terms.type === 'percentage'
    ? { type: 'percentage', rate: terms.value, required, remaining }
    : { type: 'fixed', required, remaining };
}
