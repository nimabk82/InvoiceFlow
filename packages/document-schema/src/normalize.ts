import {
  calculateDocumentTotals,
  type CalculatorDepositTerms,
  type CalculatorDiscount,
} from '@invoiceflow/calculations';

import type {
  RenderableBusiness,
  RenderableClient,
  RenderableDeposit,
  RenderableDiscount,
  RenderableDocument,
  RenderableDocumentKind,
  RenderableItem,
  RenderableRichText,
  RenderableTaxComponent,
} from './renderable-document.js';

export type NormalizeItemInput = Readonly<{
  description: string;
  secondaryDescription?: string;
  quantity: string;
  rate: string;
  appliedTaxes: readonly Readonly<{ name: string; rate: string }>[];
}>;

export type NormalizeDocumentInput = Readonly<{
  kind: RenderableDocumentKind;
  currencyCode: string;
  themeVersionId: string;
  business: RenderableBusiness;
  client: RenderableClient;
  number: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  poNumber?: string;
  items: readonly NormalizeItemInput[];
  discount?: CalculatorDiscount;
  depositTerms?: CalculatorDepositTerms;
  notes?: RenderableRichText;
  terms?: RenderableRichText;
}>;

export function normalizeDocumentForRendering(
  input: NormalizeDocumentInput,
): RenderableDocument {
  const totals = calculateDocumentTotals({
    currencyCode: input.currencyCode,
    items: input.items.map((item) => ({
      quantity: item.quantity,
      rate: item.rate,
      appliedTaxes: item.appliedTaxes,
    })),
    discount: input.discount,
    depositTerms: input.depositTerms,
  });

  const items: RenderableItem[] = input.items.map((item, index) => ({
    description: item.description,
    secondaryDescription: item.secondaryDescription,
    quantity: item.quantity,
    rate: item.rate,
    amount: totals.lineTotals[index]?.toDecimalString() ?? '0.00',
  }));

  const discount = input.discount
    ? buildRenderableDiscount(input.discount, totals.discountAmount.toDecimalString())
    : undefined;

  const deposit = input.depositTerms && totals.deposit
    ? buildRenderableDeposit(
        input.depositTerms,
        totals.deposit.required.toDecimalString(),
        totals.deposit.remaining.toDecimalString(),
      )
    : undefined;

  const taxComponents: RenderableTaxComponent[] = totals.taxComponents.map(
    (component) => ({
      name: component.name,
      rate: component.rate,
      amount: component.amount.toDecimalString(),
    }),
  );

  return {
    kind: input.kind,
    currencyCode: input.currencyCode,
    themeVersionId: input.themeVersionId,
    business: input.business,
    client: input.client,
    number: input.number,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    validUntil: input.validUntil,
    poNumber: input.poNumber,
    items,
    discount,
    subtotal: totals.subtotal.toDecimalString(),
    taxComponents,
    taxTotal: totals.taxTotal.toDecimalString(),
    total: totals.total.toDecimalString(),
    deposit,
    notes: input.notes,
    terms: input.terms,
  };
}

function buildRenderableDiscount(
  discount: CalculatorDiscount,
  amount: string,
): RenderableDiscount {
  return discount.type === 'percentage'
    ? { type: 'percentage', value: discount.value, amount }
    : { type: 'fixed', value: discount.value, amount };
}

function buildRenderableDeposit(
  terms: CalculatorDepositTerms,
  required: string,
  remaining: string,
): RenderableDeposit {
  return {
    type: terms.type,
    value: terms.value,
    required,
    remaining,
  };
}
