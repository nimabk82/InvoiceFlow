import type { RenderableDocument } from '@invoiceflow/document-schema';
import type {
  DepositStyle,
  ThemeConfig,
  TotalsEmphasis,
  TotalsLayout,
} from '@invoiceflow/theme-schema';

export type RenderedTotalsRow = Readonly<{
  label: string;
  value: string;
  emphasis?: boolean;
}>;

export type RenderedDepositBlock = Readonly<{
  required: string;
  remaining: string;
  style: DepositStyle;
}>;

export type RenderedTotalsAndDeposit = Readonly<{
  totals: Readonly<{
    rows: readonly RenderedTotalsRow[];
    layout: TotalsLayout;
    emphasis: TotalsEmphasis;
    currencyCode: string;
  }>;
  deposit: RenderedDepositBlock | undefined;
}>;

export function renderTotalsAndDeposit(
  document: RenderableDocument,
  theme: ThemeConfig,
): RenderedTotalsAndDeposit {
  return {
    totals: {
      rows: buildTotalsRows(document),
      layout: theme.totals.layout,
      emphasis: theme.totals.emphasis,
      currencyCode: document.currencyCode,
    },
    deposit: document.deposit
      ? {
          required: document.deposit.required,
          remaining: document.deposit.remaining,
          style: theme.deposit.style,
        }
      : undefined,
  };
}

export function buildTotalsRows(
  document: RenderableDocument,
): RenderedTotalsRow[] {
  const rows: RenderedTotalsRow[] = [
    { label: 'Subtotal', value: document.subtotal },
  ];

  if (document.discount) {
    rows.push({
      label:
        document.discount.type === 'percentage'
          ? `Discount (${document.discount.value}%)`
          : 'Discount',
      value: `-${document.discount.amount}`,
    });
  }

  for (const tax of document.taxComponents) {
    rows.push({ label: `${tax.name} (${tax.rate}%)`, value: tax.amount });
  }

  rows.push({ label: 'Total', value: document.total, emphasis: true });

  return rows;
}
