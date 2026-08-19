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
  private constructor(
    readonly coefficient: bigint,
    readonly scale: number,
  ) {}

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
      BigInt(intPart || '0') * pow10(scale) +
      (frac ? BigInt(frac) : 0n);

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
    const absolute = abs(this.coefficient).toString().padStart(this.scale + 1, '0');
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
