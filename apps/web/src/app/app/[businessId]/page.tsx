"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiClient, type Invoice } from "@invoiceflow/api-client";
import { calculateDocumentTotals } from "@invoiceflow/calculations";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

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

type InvoiceStats = {
  total: number;
  outstanding: number;
  overdue: number;
};

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
      <main>
        <Box sx={{ maxWidth: 900, mx: "auto", px: 2, py: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </Box>
      </main>
    );
  }

  return (
    <main>
      <Box sx={{ maxWidth: 900, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        {!error && invoices.length === 0 && (
          <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Welcome! Create your first invoice
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Send your first invoice to get paid.
            </Typography>
            <Link href={`/app/${businessId}/invoices/new`}>
              <Button>+ New Invoice</Button>
            </Link>
          </Paper>
        )}

        {!error && invoices.length > 0 && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={2}>
              <Card sx={{ flexGrow: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total invoiced
                  </Typography>
                  <Typography variant="h5">
                    {stats.total.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flexGrow: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Outstanding
                  </Typography>
                  <Typography variant="h5" sx={{ color: "warning.main" }}>
                    {stats.outstanding.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flexGrow: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Overdue
                  </Typography>
                  <Typography variant="h5" sx={{ color: "error.main" }}>
                    {stats.overdue.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <Paper elevation={1} sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Needs attention
                </Typography>
                {needsAttention.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nothing needs attention.
                  </Typography>
                ) : (
                  <List>
                    {needsAttention.map((invoice) => (
                      <ListItem key={invoice.id} divider disablePadding>
                        <Link
                          href={`/app/${businessId}/invoices/${invoice.id}`}
                          style={{ textDecoration: "none", width: "100%" }}
                        >
                          <ListItemText
                            sx={{ px: 1, py: 1 }}
                            primary={invoice.number}
                            secondary={invoice.clientSnapshot.displayName}
                          />
                        </Link>
                        <StatusBadge tone={statusTone[invoice.status] ?? "neutral"}>
                          {invoice.status}
                        </StatusBadge>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>

              <Paper elevation={1} sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recent activity
                </Typography>
                <List>
                  {invoices.slice(0, 6).map((invoice) => (
                    <ListItem key={invoice.id} divider disablePadding>
                      <ListItemText
                        sx={{ px: 1, py: 1 }}
                        primary={invoice.number}
                        secondary={`${invoice.clientSnapshot.displayName} · ${invoice.status}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Stack>
          </Stack>
        )}
      </Box>
    </main>
  );
}

function invoiceTotals(
  invoice: Invoice,
): { total: number } | undefined {
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
