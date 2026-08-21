"use client";

import type { CSSProperties } from "react";
import type { RenderableDocument } from "@invoiceflow/document-schema";
import { renderDocumentSections } from "@invoiceflow/renderer";
import { renderItemTable } from "@invoiceflow/renderer";
import { renderTotalsAndDeposit } from "@invoiceflow/renderer";
import type { ThemeConfig } from "@invoiceflow/theme-schema";

const MONEY = new Intl.NumberFormat("en-CA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(value: string): string {
  return MONEY.format(Number(value));
}

export function DocumentPaper({
  document,
  theme,
}: {
  document: RenderableDocument;
  theme: ThemeConfig;
}) {
  const rendered = renderDocumentSections({
    document,
    theme,
    renderContext: { output: "preview", locale: "en-CA", timezone: "UTC" },
  });
  const itemTable = renderItemTable(document, theme);
  const totals = renderTotalsAndDeposit(document, theme);

  const primary = theme.brand.primaryColor;
  const font = theme.typography.font;

  const pageStyle: CSSProperties = {
    fontFamily: `'${font}', sans-serif`,
    color: "#111827",
    background: theme.page.backgroundColor,
    padding: theme.page.margin === "compact" ? 24 : theme.page.margin === "spacious" ? 64 : 42,
    border:
      theme.page.border === "thin"
        ? "1px solid #d1d5db"
        : theme.page.border === "accent"
          ? `2px solid ${primary}`
          : "none",
    minHeight: "790px",
  };

  return (
    <div style={pageStyle}>
      {rendered.sections.map((section) => {
        switch (section.key) {
          case "header":
            return renderHeader(section, primary);
          case "business":
            return renderBusiness(section);
          case "document-info":
            return renderDocumentInfo(section);
          case "bill-to":
            return renderBillTo(section, theme);
          case "items":
            return renderItems(section, itemTable, theme);
          case "totals":
            return renderTotals(totals.totals, primary);
          case "deposit":
            return renderDeposit(totals.deposit, primary);
          case "notes":
            return renderTextBlock("Notes", section.content);
          case "terms":
            return renderTextBlock("Terms", section.content);
          case "footer":
            return renderFooter(section, document);
          default:
            return null;
        }
      })}
    </div>
  );
}

function renderHeader(
  section: Extract<
    ReturnType<typeof renderDocumentSections>["sections"][number],
    { key: "header" }
  >,
  primary: string,
) {
  return (
    <div
      key="header"
      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
    >
      <div style={{ fontWeight: 800, color: primary, fontSize: 20 }}>
        {section.businessName}
      </div>
      <div style={{ fontWeight: 800, letterSpacing: ".08em", fontSize: 13 }}>
        INVOICE
      </div>
    </div>
  );
}

function renderBusiness(
  section: Extract<
    ReturnType<typeof renderDocumentSections>["sections"][number],
    { key: "business" }
  >,
) {
  return (
    <div key="business" style={{ marginTop: 24, fontSize: 13, color: "#4b5563" }}>
      {section.displayName}
      {section.email ? <div>{section.email}</div> : null}
      {section.website ? <div>{section.website}</div> : null}
    </div>
  );
}

function renderDocumentInfo(
  section: Extract<
    ReturnType<typeof renderDocumentSections>["sections"][number],
    { key: "document-info" }
  >,
) {
  return (
    <div
      key="document-info"
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 32,
        fontSize: 12,
        color: "#4b5563",
      }}
    >
      <strong style={{ color: "#111827" }}>{section.number}</strong>
      <div>
        <div>Issue: {section.issueDate}</div>
        {section.dueDate ? <div>Due: {section.dueDate}</div> : null}
      </div>
    </div>
  );
}

function renderBillTo(
  section: Extract<
    ReturnType<typeof renderDocumentSections>["sections"][number],
    { key: "bill-to" }
  >,
  theme: ThemeConfig,
) {
  const style = section.style;
  const base: CSSProperties = {
    marginTop: 30,
    padding: style === "plain" ? 0 : 12,
    background: style === "soft" ? theme.brand.secondaryColor ?? "#f3f4f6" : undefined,
    border:
      style === "bordered"
        ? "1px solid #e5e7eb"
        : style === "accent-edge"
          ? `2px solid ${theme.brand.primaryColor}`
          : undefined,
    borderLeft: style === "accent-edge" ? `4px solid ${theme.brand.primaryColor}` : undefined,
  };
  return (
    <div key="bill-to" style={base}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "#6b7280" }}>
        Bill to
      </div>
      <strong style={{ display: "block", marginTop: 4 }}>{section.displayName}</strong>
      {section.emails.map((email) => (
        <div key={email} style={{ fontSize: 12, color: "#6b7280" }}>
          {email}
        </div>
      ))}
      {section.address ? (
        <div style={{ fontSize: 12, color: "#6b7280", whiteSpace: "pre-line" }}>
          {section.address}
        </div>
      ) : null}
    </div>
  );
}

function renderItems(
  section: Extract<
    ReturnType<typeof renderDocumentSections>["sections"][number],
    { key: "items" }
  >,
  itemTable: ReturnType<typeof renderItemTable>,
  theme: ThemeConfig,
) {
  const headerStyle = section.headerStyle;
  const headerBg =
    headerStyle === "filled"
      ? theme.brand.primaryColor
      : headerStyle === "soft"
        ? theme.brand.secondaryColor ?? "#f3f4f6"
        : undefined;
  const headerColor = headerStyle === "filled" ? "#ffffff" : "#111827";

  return (
    <div key="items" style={{ marginTop: 30 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `minmax(0,1fr) ${itemTable.columns.slice(1).map(() => "80px").join(" ")}`,
          gap: 12,
          padding: "9px 0",
          fontWeight: 800,
          color: headerColor,
          background: headerBg,
          paddingLeft: 8,
          paddingRight: 8,
          borderBottom: headerStyle === "line" ? "2px solid #111827" : "none",
        }}
      >
        {itemTable.columns.map((col) => (
          <div key={col.key} style={{ textAlign: col.align }}>
            {col.label}
          </div>
        ))}
      </div>
      {itemTable.rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: `minmax(0,1fr) ${itemTable.columns.slice(1).map(() => "80px").join(" ")}`,
            gap: 12,
            padding: "9px 0",
            fontSize: 12,
            background:
              section.rowStyle === "striped" && i % 2 === 1 ? "#f9fafb" : undefined,
            borderBottom:
              section.rowStyle === "separators" ? "1px solid #e5e7eb" : undefined,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          {row.cells.map((cell) => (
            <div key={cell.columnKey} style={{ textAlign: cell.align, whiteSpace: "pre-line" }}>
              {cell.value}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function renderTotals(
  totals: ReturnType<typeof renderTotalsAndDeposit>["totals"],
  primary: string,
) {
  return (
    <div key="totals" style={{ width: 300, marginLeft: "auto", marginTop: 22 }}>
      {totals.rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: row.emphasis ? 16 : 12,
            fontWeight: row.emphasis ? 800 : 400,
            padding: "5px 0",
            borderTop: row.emphasis ? "1px solid #e5e7eb" : "none",
            color: row.emphasis ? primary : "#111827",
          }}
        >
          <span>{row.label}</span>
          <span>{money(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

function renderDeposit(
  deposit: ReturnType<typeof renderTotalsAndDeposit>["deposit"],
  primary: string,
) {
  if (!deposit) return null;
  return (
    <div
      key="deposit"
      style={{
        background: `${primary}14`,
        padding: 10,
        borderRadius: 8,
        marginTop: 12,
        width: 300,
        marginLeft: "auto",
        color: primary,
        fontWeight: 800,
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Deposit due now</span>
        <span>{money(deposit.required)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 400 }}>
        <span>Remaining balance</span>
        <span>{money(deposit.remaining)}</span>
      </div>
    </div>
  );
}

function renderTextBlock(label: string, content: string) {
  if (!content) return null;
  return (
    <div key={label.toLowerCase()} style={{ marginTop: 32, fontSize: 12, color: "#4b5563" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "#6b7280" }}>
        {label}
      </div>
      <div style={{ whiteSpace: "pre-line", marginTop: 6 }}>{content}</div>
    </div>
  );
}

function renderFooter(
  section: Extract<
    ReturnType<typeof renderDocumentSections>["sections"][number],
    { key: "footer" }
  >,
  document: RenderableDocument,
) {
  const parts: string[] = [];
  if (section.showBusinessName) parts.push(document.business.displayName);
  if (section.showWebsite && document.business.website) parts.push(document.business.website);
  if (section.customText) parts.push(section.customText);

  return (
    <div
      key="footer"
      style={{
        marginTop: 40,
        textAlign: section.alignment,
        fontSize: 12,
        color: "#6b7280",
        borderTop: section.showDivider ? "1px solid #e5e7eb" : "none",
        paddingTop: section.showDivider ? 12 : 0,
      }}
    >
      {parts.length > 0 ? <div>{parts.join(" · ")}</div> : null}
      {section.showPageNumber ? <div style={{ marginTop: 4 }}>Page 1</div> : null}
    </div>
  );
}
