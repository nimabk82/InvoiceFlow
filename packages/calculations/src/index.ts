function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function pow10(exp: number): bigint {
  return 10n ** BigInt(exp);
}

function divideHalfAwayFromZero(coefficient: bigint, divisor: bigint): bigint {
  if (divisor === 0n) {
    throw new Error('Division by zero');
  }

  const negative = coefficient < 0n !== divisor < 0n;
  const a = abs(coefficient);
  const b = abs(divisor);
  const quotient = a / b;
  const remainder = a % b;
  const rounded = remainder * 2n >= b ? quotient + 1n : quotient;

  return negative ? -rounded : rounded;
}

export class Decimal {
  readonly coefficient: bigint;
  readonly scale: number;

  private constructor(coefficient: bigint, scale: number) {
    this.coefficient = coefficient;
    this.scale = scale;
  }

  static fromString(value: string): Decimal {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error(`Invalid decimal: ${value}`);
    }

    let negative = false;
    let body = trimmed;

    if (body.startsWith('-')) {
      negative = true;
      body = body.slice(1);
    } else if (body.startsWith('+')) {
      body = body.slice(1);
    }

    const dot = body.indexOf('.');

    if (dot !== -1 && body.indexOf('.', dot + 1) !== -1) {
      throw new Error(`Invalid decimal: ${value}`);
    }

    const intPart = dot === -1 ? body : body.slice(0, dot);
    const fracPart = dot === -1 ? '' : body.slice(dot + 1);

    if (!/^\d+$/.test(intPart) || !/^\d*$/.test(fracPart)) {
      throw new Error(`Invalid decimal: ${value}`);
    }

    const frac = fracPart.replace(/0+$/, '');
    const scale = frac.length;
    const coefficient =
      BigInt(intPart || '0') * pow10(scale) + (frac ? BigInt(frac) : 0n);

    return new Decimal(negative ? -coefficient : coefficient, scale);
  }

  static zero(): Decimal {
    return new Decimal(0n, 0);
  }

  static fromCoefficient(coefficient: bigint, scale: number): Decimal {
    return new Decimal(coefficient, scale);
  }

  get isZero(): boolean {
    return this.coefficient === 0n;
  }

  get isNegative(): boolean {
    return this.coefficient < 0n;
  }

  abs(): Decimal {
    return this.coefficient < 0n
      ? new Decimal(-this.coefficient, this.scale)
      : this;
  }

  negate(): Decimal {
    return new Decimal(-this.coefficient, this.scale);
  }

  add(other: Decimal): Decimal {
    const scale = Math.max(this.scale, other.scale);

    return new Decimal(
      this.coefficient * pow10(scale - this.scale) +
        other.coefficient * pow10(scale - other.scale),
      scale,
    );
  }

  subtract(other: Decimal): Decimal {
    return this.add(other.negate());
  }

  multiply(other: Decimal): Decimal {
    return new Decimal(
      this.coefficient * other.coefficient,
      this.scale + other.scale,
    );
  }

  divide(other: Decimal, precision = 20): Decimal {
    if (other.isZero) {
      throw new Error('Division by zero');
    }

    const numerator = this.coefficient * pow10(precision + other.scale);
    const denominator = other.coefficient * pow10(this.scale);
    const coefficient = divideHalfAwayFromZero(numerator, denominator);

    return new Decimal(coefficient, precision);
  }

  round(targetScale: number): Decimal {
    if (targetScale < 0) {
      throw new Error(`Invalid scale: ${targetScale}`);
    }

    if (targetScale >= this.scale) {
      return new Decimal(
        this.coefficient * pow10(targetScale - this.scale),
        targetScale,
      );
    }

    const shift = this.scale - targetScale;
    const coefficient = divideHalfAwayFromZero(
      this.coefficient,
      pow10(shift),
    );

    return new Decimal(coefficient, targetScale);
  }

  compare(other: Decimal): number {
    const scale = Math.max(this.scale, other.scale);
    const a = this.coefficient * pow10(scale - this.scale);
    const b = other.coefficient * pow10(scale - other.scale);

    return a < b ? -1 : a > b ? 1 : 0;
  }

  toFixed(targetScale: number): string {
    const rounded = this.round(targetScale);
    const negative = rounded.coefficient < 0n;
    const absolute = abs(rounded.coefficient);
    const padded = absolute.toString().padStart(targetScale + 1, '0');

    if (targetScale === 0) {
      return `${negative ? '-' : ''}${padded}`;
    }

    const intPart = padded.slice(0, -targetScale);
    const fracPart = padded.slice(-targetScale);

    return `${negative ? '-' : ''}${intPart}.${fracPart}`;
  }

  toString(): string {
    if (this.scale === 0) {
      return this.coefficient.toString();
    }

    const negative = this.coefficient < 0n;
    const absolute = abs(this.coefficient)
      .toString()
      .padStart(this.scale + 1, '0');
    const intPart = absolute.slice(0, -this.scale);
    const fracPart = absolute.slice(-this.scale).replace(/0+$/, '');

    return (
      (negative ? '-' : '') +
      intPart +
      (fracPart ? `.${fracPart}` : '')
    );
  }

  toNumber(): number {
    return Number(this.toString());
  }
}

export class Money {
  readonly minorUnits: bigint;
  readonly currencyCode: string;
  readonly scale: number;

  private constructor(
    minorUnits: bigint,
    currencyCode: string,
    scale: number,
  ) {
    this.minorUnits = minorUnits;
    this.currencyCode = currencyCode;
    this.scale = scale;
  }

  static fromDecimalString(
    value: string,
    currencyCode: string,
    scale = 2,
  ): Money {
    const rounded = Decimal.fromString(value).round(scale);
    return new Money(rounded.coefficient, currencyCode, scale);
  }

  static fromMinorUnits(
    minorUnits: bigint,
    currencyCode: string,
    scale = 2,
  ): Money {
    return new Money(minorUnits, currencyCode, scale);
  }

  static zero(currencyCode: string, scale = 2): Money {
    return new Money(0n, currencyCode, scale);
  }

  get isZero(): boolean {
    return this.minorUnits === 0n;
  }

  get isNegative(): boolean {
    return this.minorUnits < 0n;
  }

  add(other: Money): Money {
    this.assertSame(other);
    return new Money(
      this.minorUnits + other.minorUnits,
      this.currencyCode,
      this.scale,
    );
  }

  subtract(other: Money): Money {
    this.assertSame(other);
    return new Money(
      this.minorUnits - other.minorUnits,
      this.currencyCode,
      this.scale,
    );
  }

  multiply(factor: Decimal): Money {
    const product = factor.multiply(
      Decimal.fromCoefficient(this.minorUnits, this.scale),
    );
    return new Money(
      product.round(this.scale).coefficient,
      this.currencyCode,
      this.scale,
    );
  }

  percentOf(percent: Decimal): Money {
    return this.multiply(percent.divide(Decimal.fromString('100'), 20));
  }

  divide(other: Money, precision = 20): Decimal {
    this.assertSame(other);
    return Decimal.fromCoefficient(this.minorUnits, this.scale).divide(
      Decimal.fromCoefficient(other.minorUnits, other.scale),
      precision,
    );
  }

  compare(other: Money): number {
    this.assertSame(other);
    return this.minorUnits < other.minorUnits
      ? -1
      : this.minorUnits > other.minorUnits
        ? 1
        : 0;
  }

  toDecimalString(): string {
    return Decimal.fromCoefficient(this.minorUnits, this.scale).toFixed(
      this.scale,
    );
  }

  toMinorUnits(): bigint {
    return this.minorUnits;
  }

  toNumber(): number {
    return Number(this.toDecimalString());
  }

  private assertSame(other: Money): void {
    if (other.currencyCode !== this.currencyCode) {
      throw new Error(
        `Currency mismatch: ${this.currencyCode} vs ${other.currencyCode}`,
      );
    }

    if (other.scale !== this.scale) {
      throw new Error(`Scale mismatch: ${this.scale} vs ${other.scale}`);
    }
  }
}

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
      sum.add(
        Money.fromDecimalString(payment.amount, total.currencyCode, total.scale),
      ),
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
