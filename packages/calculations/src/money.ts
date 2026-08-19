import { Decimal } from './decimal.js';

export class Money {
  private constructor(
    readonly minorUnits: bigint,
    readonly currencyCode: string,
    readonly scale: number,
  ) {}

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
