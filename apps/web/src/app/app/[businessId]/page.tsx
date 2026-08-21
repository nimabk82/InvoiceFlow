"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiClient, type Invoice } from "@invoiceflow/api-client";
import { calculateDocumentTotals } from "@invoiceflow/calculations";
import { Alert, Box, Card, CircularProgress, Typography } from "@mui/material";

import { Button, StatusBadge, type StatusTone } from "@/components/ui";
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

type InvoiceStats = { total: number; outstanding: number; overdue: number };

export default function DashboardPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) {
          setError("You must be signed in.");
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
            caught instanceof Error ? caught.message : "Failed to load data.",
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

  const stats: InvoiceStats = useMemo(() => {
    let total = 0;
    let outstanding = 0;
    let overdue = 0;

    for (const invoice of invoices) {
      const amounts = invoiceTotals(invoice);
      if (!amounts) continue;
      total += amounts.total;

      if (invoice.status === "partially_paid") {
        outstanding += amounts.total;
      } else if (invoice.status === "sent" || invoice.status === "viewed") {
        outstanding += amounts.total;
        if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
          overdue += amounts.total;
        }
      } else if (invoice.status === "overdue") {
        outstanding += amounts.total;
        overdue += amounts.total;
      }
    }

    return { total, outstanding, overdue };
  }, [invoices]);

  const needsAttention = invoices.filter(
    (invoice) =>
      invoice.status === "overdue" ||
      invoice.status === "partially_paid" ||
      ((invoice.status === "sent" || invoice.status === "viewed") &&
        invoice.dueDate &&
        new Date(invoice.dueDate) < new Date()),
  );

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

  if (invoices.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Welcome! Create your first invoice
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Send your first invoice to get paid.
        </Typography>
        <Link href={`/app/${businessId}/invoices/new`}>
          <Button>+ New Invoice</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <div className="hero-actions" style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        <Link href={`/app/${businessId}/invoices/new`} style={{ textDecoration: "none" }}>
          <Button>+ New Invoice</Button>
        </Link>
      </div>

      <div className="stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        <Card sx={{ p: 2 }}>
          <div className="label" style={{ fontSize: 12, color: "#667085", fontWeight: 650 }}>
            Total invoiced
          </div>
          <div className="value money" style={{ fontSize: 27, fontWeight: 800, marginTop: 12 }}>
            {stats.total.toFixed(2)}
          </div>
        </Card>
        <Card sx={{ p: 2 }}>
          <div className="label" style={{ fontSize: 12, color: "#667085", fontWeight: 650 }}>
            Outstanding
          </div>
          <div className="value money" style={{ fontSize: 27, fontWeight: 800, marginTop: 12, color: "#B45309" }}>
            {stats.outstanding.toFixed(2)}
          </div>
        </Card>
        <Card sx={{ p: 2 }}>
          <div className="label" style={{ fontSize: 12, color: "#667085", fontWeight: 650 }}>
            Overdue
          </div>
          <div className="value money" style={{ fontSize: 27, fontWeight: 800, marginTop: 12, color: "#B42318" }}>
            {stats.overdue.toFixed(2)}
          </div>
        </Card>
      </div>

      <div className="if-twocol">
        <Card sx={{ p: 2 }}>
          <div className="section-title" style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
            Needs attention
          </div>
          {needsAttention.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nothing needs attention.
            </Typography>
          ) : (
            needsAttention.map((invoice) => (
              <div
                key={invoice.id}
                className="attention-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "13px 0",
                  borderBottom: "1px solid #E4E7EC",
                }}
              >
                <div>
                  <Link
                    href={`/app/${businessId}/invoices/${invoice.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <strong style={{ fontSize: 13 }}>{invoice.number}</strong>
                  </Link>
                  <div className="meta" style={{ fontSize: 11, color: "#667085", marginTop: 3 }}>
                    {invoice.clientSnapshot.displayName}
                  </div>
                </div>
                <StatusBadge tone={statusTone[invoice.status] ?? "neutral"}>
                  {invoice.status}
                </StatusBadge>
              </div>
            ))
          )}
        </Card>

        <Card sx={{ p: 2 }}>
          <div className="section-title" style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
            Recent activity
          </div>
          {invoices.slice(0, 6).map((invoice) => (
            <div
              key={invoice.id}
              className="activity-item"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                padding: "13px 0",
                borderBottom: "1px solid #E4E7EC",
              }}
            >
              <div>
                <strong style={{ fontSize: 13 }}>{invoice.number}</strong>
                <div className="meta" style={{ fontSize: 11, color: "#667085", marginTop: 3 }}>
                  {invoice.clientSnapshot.displayName}
                </div>
              </div>
              <StatusBadge tone={statusTone[invoice.status] ?? "neutral"}>
                {invoice.status}
              </StatusBadge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function invoiceTotals(invoice: Invoice): { total: number } | undefined {
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
    return { total: totals.total.toNumber() };
  } catch {
    return undefined;
  }
}
