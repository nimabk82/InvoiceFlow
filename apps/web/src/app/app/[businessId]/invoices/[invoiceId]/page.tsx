"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiClient, type Invoice } from "@invoiceflow/api-client";
import { calculateDocumentTotals } from "@invoiceflow/calculations";
import {
  Alert,
  Box,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

export default function InvoiceDetailPage() {
  const params = useParams<{ businessId: string; invoiceId: string }>();
  const { businessId, invoiceId } = params;
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;

      if (!token) {
        if (!cancelled) setError("You must be signed in.");
        return;
      }

      try {
        const found = await apiClient.getInvoice(businessId, invoiceId, token);
        if (!cancelled) setInvoice(found);
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error ? caught.message : "Failed to load invoice.",
          );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId, invoiceId]);

  const totals = useMemo(() => {
    if (!invoice) return null;
    try {
      return calculateDocumentTotals({
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
    } catch {
      return null;
    }
  }, [invoice]);

  if (error) {
    return (
      <main>
        <Box sx={{ maxWidth: 760, mx: "auto", px: 2, py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main>
        <Box sx={{ maxWidth: 760, mx: "auto", px: 2, py: 4 }}>
          <Typography variant="body1">Loading…</Typography>
        </Box>
      </main>
    );
  }

  const clientAddressLines = [
    invoice.clientSnapshot.address?.line1,
    invoice.clientSnapshot.address?.line2,
    [invoice.clientSnapshot.address?.city, invoice.clientSnapshot.address?.region]
      .filter(Boolean)
      .join(", "),
    [
      invoice.clientSnapshot.address?.postalCode,
      invoice.clientSnapshot.address?.countryCode,
    ]
      .filter(Boolean)
      .join(" "),
  ].filter(Boolean);

  return (
    <main>
      <Box sx={{ maxWidth: 760, mx: "auto", px: 2, py: 4 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography variant="h4" component="h1">
              {invoice.number}
            </Typography>
            <StatusBadge tone={statusTone[invoice.status] ?? "neutral"}>
              {invoice.status}
            </StatusBadge>
          </Stack>
          <Button variant="outlined" onClick={() => router.back()}>
            Back
          </Button>
        </Stack>

        <Paper elevation={1} sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  From
                </Typography>
                <Typography variant="body1">
                  {invoice.businessSnapshot.displayName}
                </Typography>
                {invoice.businessSnapshot.email && (
                  <Typography variant="body2" color="text.secondary">
                    {invoice.businessSnapshot.email}
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" color="text.secondary">
                  Issue date: {invoice.issueDate}
                </Typography>
                {invoice.dueDate && (
                  <Typography variant="body2" color="text.secondary">
                    Due date: {invoice.dueDate}
                  </Typography>
                )}
                {invoice.poNumber && (
                  <Typography variant="body2" color="text.secondary">
                    PO #: {invoice.poNumber}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Bill to
              </Typography>
              <Typography variant="body1">
                {invoice.clientSnapshot.displayName}
              </Typography>
              {invoice.clientSnapshot.emails.map((email) => (
                <Typography key={email} variant="body2" color="text.secondary">
                  {email}
                </Typography>
              ))}
              {clientAddressLines.map((line) => (
                <Typography key={line} variant="body2" color="text.secondary">
                  {line}
                </Typography>
              ))}
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {item.description}
                        {item.secondaryDescription && (
                          <Typography variant="body2" color="text.secondary">
                            {item.secondaryDescription}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.rate}</TableCell>
                      <TableCell align="right">
                        {totals?.lineTotals[index]?.toDecimalString() ?? "0.00"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ textAlign: "right" }}>
              {totals && (
                <>
                  <Typography variant="body1">
                    Subtotal: {totals.subtotal.toDecimalString()}
                  </Typography>
                  {totals.discountAmount && !totals.discountAmount.isZero && (
                    <Typography variant="body1">
                      Discount: -{totals.discountAmount.toDecimalString()}
                    </Typography>
                  )}
                  <Typography variant="body1">
                    Tax: {totals.taxTotal.toDecimalString()}
                  </Typography>
                  <Typography variant="h6">
                    Total: {totals.total.toDecimalString()}
                  </Typography>
                </>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Summary
              </Typography>
              <Typography variant="body1">
                Paid: {totals ? `0.00 ${invoice.currencyCode}` : "—"}
              </Typography>
              <Typography variant="body1">
                Balance:{" "}
                {totals
                  ? `${totals.total.toDecimalString()} ${invoice.currencyCode}`
                  : "—"}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button
            onClick={() =>
              router.push(`/app/${businessId}/invoices/${invoiceId}/send`)
            }
          >
            Send Again
          </Button>
        </Box>
      </Box>
    </main>
  );
}
