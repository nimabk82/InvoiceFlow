import type { RenderableDocument } from '@invoiceflow/document-schema';
import type {
  ItemHeaderStyle,
  ItemRowStyle,
  ThemeConfig,
} from '@invoiceflow/theme-schema';

export type ItemTableColumnKey =
  | 'description'
  | 'quantity'
  | 'rate'
  | 'amount';

export type ItemTableColumn = Readonly<{
  key: ItemTableColumnKey;
  label: string;
  align: 'left' | 'right';
}>;

export type RenderedItemCell = Readonly<{
  columnKey: ItemTableColumnKey;
  value: string;
  align: 'left' | 'right';
}>;

export type RenderedItemTableRow = Readonly<{
  cells: readonly RenderedItemCell[];
}>;

export type RenderedItemTable = Readonly<{
  columns: readonly ItemTableColumn[];
  headerStyle: ItemHeaderStyle;
  rowStyle: ItemRowStyle;
  rows: readonly RenderedItemTableRow[];
}>;

export function renderItemTable(
  document: RenderableDocument,
  theme: ThemeConfig,
): RenderedItemTable {
  const columns = buildColumns(theme);
  const rows: RenderedItemTableRow[] = document.items.map((item) => ({
    cells: columns.map((column) => ({
      columnKey: column.key,
      value: cellValue(item, column.key),
      align: column.align,
    })),
  }));

  return {
    columns,
    headerStyle: theme.items.headerStyle,
    rowStyle: theme.items.rowStyle,
    rows,
  };
}

function buildColumns(theme: ThemeConfig): ItemTableColumn[] {
  const columns: ItemTableColumn[] = [
    { key: 'description', label: 'Description', align: 'left' },
  ];

  if (theme.items.showQuantity) {
    columns.push({ key: 'quantity', label: 'Qty', align: 'right' });
  }

  if (theme.items.showRate) {
    columns.push({ key: 'rate', label: 'Rate', align: 'right' });
  }

  columns.push({ key: 'amount', label: 'Amount', align: 'right' });

  return columns;
}

function cellValue(
  item: RenderableDocument['items'][number],
  columnKey: ItemTableColumnKey,
): string {
  switch (columnKey) {
    case 'description':
      return item.secondaryDescription
        ? `${item.description}\n${item.secondaryDescription}`
        : item.description;
    case 'quantity':
      return item.quantity;
    case 'rate':
      return item.rate;
    case 'amount':
      return item.amount;
  }
}
