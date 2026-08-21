"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiClient, type Invoice } from "@invoiceflow/api-client";
import { calculateDocumentTotals } from "@invoiceflow/calculations";
import { Alert, Box, Card, CircularProgress, Typography } from "@mui/material";

import { Button, Input, StatusBadge, type StatusTone } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

const statusTone: Record<string, StatusTone> = {
  draft: "neutral",
  sent: "info",
  viewed: "info",
  partially_paid: "warning",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

const TABS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "void", label: "Void" },
];

export default function InvoicesPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) {
          setError("You must be signed in to view invoices.");
          setLoading(false);
        }
        return;
      }
      try {
        const page = await apiClient.listInvoices(
          businessId,
          session.access_token,
        );
        if (!cancelled) {
          setInvoices([...page.items]);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load invoices.",
          );
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesTab = tab === "all" || invoice.status === tab;
      const matchesSearch =
        query === "" ||
        invoice.number.toLowerCase().includes(query) ||
        invoice.clientSnapshot.displayName.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [invoices, tab, search]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <div>
      <div className="if-toolbar">
        <div className="if-search">
          <Input
            className="if-search-input"
            placeholder="Search invoices..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
          />
        </div>
        <Link href={`/app/${businessId}/invoices/new`} style={{ textDecoration: "none" }}>
          <Button>+ New Invoice</Button>
        </Link>
      </div>

      <div className="if-tabs">
        {TABS.map((item) => (
          <button
            key={item.value}
            className={`if-tab ${tab === item.value ? "if-active" : ""}`}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No invoices match.
        </Typography>
      ) : (
        <>
          <Card className="if-table">
            <div className="if-table-head">
              <div>Number</div>
              <div>Client</div>
              <div>Issue</div>
              <div>Due</div>
              <div className="right" style={{ textAlign: "right" }}>Amount</div>
            </div>
            {filtered.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/app/${businessId}/invoices/${invoice.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="if-table-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>{invoice.number}</strong>
                    <StatusBadge tone={statusTone[invoice.status] ?? "neutral"}>
                      {invoice.status}
                    </StatusBadge>
                  </div>
                  <div>
                    <strong>{invoice.clientSnapshot.displayName}</strong>
                  </div>
                  <span>{invoice.issueDate}</span>
                  <span>{invoice.dueDate ?? "—"}</span>
                  <div className="right money" style={{ textAlign: "right", fontWeight: 700 }}>
                    {amountFor(invoice)}
                  </div>
                </div>
              </Link>
            ))}
          </Card>

          <div className="if-mobile-list">
            {filtered.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/app/${businessId}/invoices/${invoice.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="if-mobile-card">
                  <div className="top">
                    <strong>{invoice.number}</strong>
                    <StatusBadge tone={statusTone[invoice.status] ?? "neutral"}>
                      {invoice.status}
                    </StatusBadge>
                  </div>
                  <p>{invoice.clientSnapshot.displayName}</p>
                  <div className="bottom" style={{ display: "flex", justifyContent: "space-between", marginTop: 13 }}>
                    <span style={{ fontSize: 11, color: "#667085" }}>{invoice.issueDate}</span>
                    <strong className="money">{amountFor(invoice)}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


function amountFor(invoice: Invoice): string {
  try {
    const totals = calculateDocumentTotals({
      currencyCode: invoice.currencyCode,
      items: invoice.items.map((item) => ({
        quantity: item.quantity,
        rate: item.rate,
        appliedTaxes: (item.appliedTaxes ?? []).filter(
          (tax) => tax.name.trim() !== "" || tax.rate.trim() !== "",
        ),
      })),
      discount: invoice.discount,
      depositTerms: invoice.depositTerms,
    });
    return totals.total.toDecimalString();
  } catch {
    return "0.00";
  }
}
