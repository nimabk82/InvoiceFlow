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
  Card,
  Stack,
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


  return (
    <div>
      {/* Detail hero */}
      <Card sx={{ p: 2, mb: 3 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <h2 style={{ fontSize: 20, margin: 0, color: "#101828" }}>{invoice.number}</h2>
              <StatusBadge tone={statusTone[invoice.status] ?? "neutral"}>{invoice.status}</StatusBadge>
            </div>
            <p style={{ fontSize: 12, color: "#667085", margin: "5px 0 0" }}>
              {invoice.clientSnapshot.displayName} · {invoice.clientSnapshot.emails[0] ?? ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {invoice.status === "draft" && (
              <Button variant="outlined" color="error" onClick={handleDelete}>Delete</Button>
            )}
            <Button variant="outlined" onClick={openPayment}>Record Payment</Button>
            <Button variant="outlined" onClick={handleDuplicate}>Duplicate</Button>
            {invoice.status !== "draft" && invoice.status !== "void" && (
              <Button variant="outlined" color="error" onClick={handleVoid}>Void</Button>
            )}
            <Button onClick={() => router.push(`/app/${businessId}/invoices/${invoiceId}/send`)}>Send Again</Button>
          </div>
        </div>
      </Card>

      {/* Amount strip */}
      <Card sx={{ overflow: "hidden", mb: 3 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid #E4E7EC" }}>
          <AmountBlock label="Total" value={totals ? `${totals.total.toDecimalString()}` : "—"} />
          <AmountBlock label="Paid" value={totals ? `${paidAmount.toFixed(2)} ${invoice.currencyCode}` : "—"} />
          <AmountBlock label="Balance" value={totals ? `${(totals.total.toNumber() - paidAmount).toFixed(2)} ${invoice.currencyCode}` : "—"} />
        </div>
      </Card>

      {/* Items + totals */}
      <Card sx={{ overflow: "hidden", mb: 3 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(200px,1fr) 80px 100px 110px", gap: 10, alignItems: "center", padding: "0 18px", height: 42, background: "#FCFCFD", color: "#667085", fontSize: 11, fontWeight: 800 }}>
          <div>Description</div>
          <div>Qty</div>
          <div>Rate</div>
          <div style={{ textAlign: "right" }}>Amount</div>
        </div>
        {invoice.items.map((item, index) => (
          <div key={index} style={{ display: "grid", gridTemplateColumns: "minmax(200px,1fr) 80px 100px 110px", gap: 10, alignItems: "center", padding: "10px 18px", borderTop: "1px solid #E4E7EC", minHeight: 56 }}>
            <div>
              <strong style={{ fontSize: 13, color: "#101828" }}>{item.description}</strong>
              {item.secondaryDescription && <div style={{ fontSize: 11, color: "#667085" }}>{item.secondaryDescription}</div>}
            </div>
            <span style={{ fontSize: 12, color: "#667085" }}>{item.quantity}</span>
            <span style={{ fontSize: 12, color: "#667085" }}>{item.rate}</span>
            <div className="money" style={{ textAlign: "right", fontWeight: 700 }}>{totals?.lineTotals[index]?.toDecimalString() ?? "0.00"}</div>
          </div>
        ))}
        <div style={{ width: 300, marginLeft: "auto", padding: "0 18px 14px", marginTop: 8 }}>
          <TotalRow label="Subtotal" value={totals?.subtotal.toDecimalString() ?? "0.00"} />
          {totals?.discountAmount && !totals.discountAmount.isZero && <TotalRow label="Discount" value={`-${totals.discountAmount.toDecimalString()}`} />}
          <TotalRow label="Tax" value={totals?.taxTotal.toDecimalString() ?? "0.00"} />
          <TotalRow label="Total" value={totals?.total.toDecimalString() ?? "0.00"} total />
        </div>
      </Card>

      {/* Activity */}
      <Card sx={{ p: 2 }}>
        <div className="section-title" style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Activity</div>
        {activity.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No activity yet.</Typography>
        ) : (
          activity.map((event) => (
            <div key={event.id} className="timeline-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid #E4E7EC" }}>
              <div className="dot" style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", background: "#ECFDF3", color: "#15803D", fontSize: 12, fontWeight: 800 }}>✓</div>
              <div>
                <strong style={{ fontSize: 13, color: "#101828" }}>{activityLabel(event)}</strong>
                <div style={{ fontSize: 11, color: "#667085" }}>{new Date(event.occurredAt).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </Card>

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
    </div>
  );
}

function AmountBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 18, borderRight: "1px solid #E4E7EC" }}>
      <div style={{ fontSize: 11, color: "#667085" }}>{label}</div>
      <div className="money" style={{ display: "block", fontSize: 23, marginTop: 8, fontWeight: 800, color: "#101828" }}>
        {value}
      </div>
    </div>
  );
}

function TotalRow({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return (
    <div
      className="money"
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: total ? 16 : 12,
        fontWeight: total ? 800 : 400,
        padding: "5px 0",
        borderTop: total ? "1px solid #E4E7EC" : "none",
        marginTop: total ? 6 : 0,
        paddingTop: total ? 11 : 0,
      }}
    >
      <span style={{ color: "#667085" }}>{label}</span>
      <strong style={{ color: "#101828" }}>{value}</strong>
    </div>
  );
}

function activityLabel(event: ActivityEvent): string {  switch (event.type) {
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
