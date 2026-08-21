"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ApiClient,
  type ActivityEvent,
  type Invoice,
  type Payment,
} from "@invoiceflow/api-client";
import { calculateDocumentTotals } from "@invoiceflow/calculations";
import {
  Alert,
  Box,
  Divider,
  List,
  ListItem,
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

import { Button, Dialog, Input, StatusBadge, type StatusTone } from "@/components/ui";
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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
        const [found, paymentList, activityList] = await Promise.all([
          apiClient.getInvoice(businessId, invoiceId, token),
          apiClient.listPayments(businessId, invoiceId, token),
          apiClient.listActivity(businessId, invoiceId, token),
        ]);
        if (!cancelled) {
          setInvoice(found);
          setPayments([...paymentList]);
          setActivity([...activityList]);
        }
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

  const paidAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  function openPayment() {
    setPaymentError(null);
    setAmount(totals ? totals.total.toDecimalString() : "");
    setPaidAt(new Date().toISOString().slice(0, 10));
    setMethod("");
    setReference("");
    setPaymentOpen(true);
  }

  async function savePayment() {
    setPaymentError(null);
    setSavingPayment(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setPaymentError("You must be signed in.");
      setSavingPayment(false);
      return;
    }

    try {
      const result = await apiClient.recordPayment(
        businessId,
        invoiceId,
        { amount, paidAt, method: method || undefined, reference: reference || undefined },
        token,
      );
      setInvoice(result.invoice);
      const paymentList = await apiClient.listPayments(businessId, invoiceId, token);
      setPayments([...paymentList]);
      setPaymentOpen(false);
    } catch (caught) {
      setPaymentError(
        caught instanceof Error ? caught.message : "Failed to record payment.",
      );
    } finally {
      setSavingPayment(false);
    }
  }

  async function handleDuplicate() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) return;

    try {
      const copy = await apiClient.duplicateInvoice(
        businessId,
        invoiceId,
        token,
      );
      router.push(`/app/${businessId}/invoices/${copy.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to duplicate invoice.",
      );
    }
  }

  async function handleVoid() {
    if (!window.confirm("Void this invoice? This cannot be undone.")) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) return;

    try {
      const updated = await apiClient.voidInvoice(businessId, invoiceId, token);
      setInvoice(updated);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to void invoice.",
      );
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this draft invoice? This cannot be undone.")) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) return;

    try {
      await apiClient.deleteInvoice(businessId, invoiceId, token);
      router.push(`/app/${businessId}/invoices`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to delete invoice.",
      );
    }
  }

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
                Paid:{" "}
                {totals ? `${paidAmount.toFixed(2)} ${invoice.currencyCode}` : "—"}
              </Typography>
              <Typography variant="body1">
                Balance:{" "}
                {totals
                  ? `${(totals.total.toNumber() - paidAmount).toFixed(2)} ${invoice.currencyCode}`
                  : "—"}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Activity
          </Typography>
          {activity.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No activity yet.
            </Typography>
          ) : (
            <List>
              {activity.map((event) => (
                <ListItem key={event.id} divider>
                  <Stack direction="row" sx={{ justifyContent: "space-between", width: "100%", gap: 2 }}>
                    <Typography variant="body1">{activityLabel(event)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(event.occurredAt).toLocaleString()}
                    </Typography>
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          {invoice.status === "draft" && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
          <Button variant="outlined" onClick={openPayment}>
            Record Payment
          </Button>
          <Button variant="outlined" onClick={handleDuplicate}>
            Duplicate
          </Button>
          {invoice.status !== "draft" && invoice.status !== "void" && (
            <Button variant="outlined" color="error" onClick={handleVoid}>
              Void
            </Button>
          )}
          <Button
            onClick={() =>
              router.push(`/app/${businessId}/invoices/${invoiceId}/send`)
            }
          >
            Send Again
          </Button>
        </Box>

        <Dialog
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          title="Record Payment"
          actions={
            <>
              <Button variant="outlined" onClick={() => setPaymentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={savePayment} disabled={savingPayment}>
                {savingPayment ? "Saving…" : "Record Payment"}
              </Button>
            </>
          }
        >
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Input
              label="Amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
            />
            <Input
              label="Method"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              placeholder="e.g. Credit card, Bank transfer"
            />
            <Input
              label="Reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
            {paymentError && <Alert severity="error">{paymentError}</Alert>}
          </Stack>
        </Dialog>
      </Box>
    </main>
  );
}

function activityLabel(event: ActivityEvent): string {
  switch (event.type) {
    case "created":
      return "Invoice created";
    case "sent":
      return "Invoice sent";
    case "viewed":
      return "Invoice viewed by client";
    case "payment_recorded": {
      const amount = event.metadata?.amount;
      return amount ? `Payment of ${amount} recorded` : "Payment recorded";
    }
    case "voided":
      return "Invoice voided";
    default:
      return event.type;
  }
}
