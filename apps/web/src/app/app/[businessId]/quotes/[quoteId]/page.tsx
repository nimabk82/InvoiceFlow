"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ApiClient,
  type ActivityEvent,
  type Quote,
} from "@invoiceflow/api-client";
import { calculateDocumentTotals } from "@invoiceflow/calculations";
import { Alert, Card, Typography } from "@mui/material";

import { Button, StatusBadge, Toast, useToast, type StatusTone } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

const statusTone: Record<string, StatusTone> = {
  draft: "neutral",
  sent: "info",
  viewed: "info",
  accepted: "success",
  declined: "danger",
  expired: "neutral",
};

export default function QuoteDetailPage() {
  const params = useParams<{ businessId: string; quoteId: string }>();
  const { businessId, quoteId } = params;
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast, setToast } = useToast();

  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${businessId}:${quoteId}`;
    if (startedRef.current === key) return;
    startedRef.current = key;
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
        const [found, activityList] = await Promise.all([
          apiClient.getQuote(businessId, quoteId, token),
          apiClient.listQuoteActivity(businessId, quoteId, token),
        ]);
        if (!cancelled) {
          setQuote(found);
          setActivity([...activityList]);
        }
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error ? caught.message : "Failed to load quote.",
          );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [businessId, quoteId]);

  const totals = useMemo(() => {
    if (!quote) return null;
    try {
      return calculateDocumentTotals({
        currencyCode: quote.currencyCode,
        items: quote.items.map((item) => ({
          quantity: item.quantity,
          rate: item.rate,
          appliedTaxes: (item.appliedTaxes ?? []).filter(
            (tax) => tax.name.trim() !== "" || tax.rate.trim() !== "",
          ),
        })),
        depositTerms: quote.proposedDepositTerms
          ? { type: quote.proposedDepositTerms.type, value: quote.proposedDepositTerms.value }
          : undefined,
      });
    } catch {
      return null;
    }
  }, [quote]);

  async function token() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function handleAction(action: "accept" | "decline" | "convert" | "send") {
    setError(null);
    const t = await token();
    if (!t) {
      setError("You must be signed in.");
      return;
    }
    try {
      if (action === "accept") {
        const updated = await apiClient.acceptQuote(businessId, quoteId, t);
        setQuote(updated);
        setToast("Quote accepted");
      } else if (action === "decline") {
        const updated = await apiClient.declineQuote(businessId, quoteId, t);
        setQuote(updated);
        setToast("Quote declined");
      } else if (action === "convert") {
        const result = await apiClient.convertQuote(businessId, quoteId, t);
        router.push(`/app/${businessId}/invoices/${result.invoice.id}`);
      } else {
        router.push(`/app/${businessId}/quotes/${quoteId}/send`);
      }
      const activityList = await apiClient.listQuoteActivity(businessId, quoteId, t);
      setActivity([...activityList]);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Action failed.",
      );
    }
  }

  if (error && !quote) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!quote) {
    return <Typography variant="body1">Loading…</Typography>;
  }

  return (
    <div>
      <Card className="if-detail-hero" sx={{ mb: 3 }}>
        <div className="if-detail-title">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <h2>{quote.number}</h2>
            <StatusBadge tone={statusTone[quote.status] ?? "neutral"}>{quote.status}</StatusBadge>
          </div>
          <p>{quote.clientSnapshot.displayName} · {quote.clientSnapshot.emails[0] ?? ""}</p>
        </div>
        <div className="if-actions">
          {quote.status === "sent" || quote.status === "viewed" ? (
            <>
              <Button variant="outlined" onClick={() => handleAction("accept")}>Accept</Button>
              <Button variant="outlined" color="error" onClick={() => handleAction("decline")}>Decline</Button>
            </>
          ) : null}
          {quote.status === "accepted" && quote.convertedInvoiceIds.length === 0 && (
            <Button onClick={() => handleAction("convert")}>Convert to Invoice</Button>
          )}
          {quote.convertedInvoiceIds.length > 0 && (
            <Button
              variant="outlined"
              onClick={() =>
                router.push(`/app/${businessId}/invoices/${quote.convertedInvoiceIds[0]}`)
              }
            >
              View Invoice
            </Button>
          )}
          <Button variant="outlined" onClick={() => handleAction("send")}>Send Again</Button>
          <Button variant="outlined" onClick={() => router.back()}>Back</Button>
        </div>
      </Card>

      <Card sx={{ overflow: "hidden", mb: 3 }}>
        <div className="if-amount-strip">
          <AmountBlock label="Total" value={totals ? `${totals.total.toDecimalString()}` : "—"} />
          <AmountBlock label="Valid until" value={quote.validUntil ?? "—"} />
          <AmountBlock label="Proposed deposit" value={totals?.deposit ? `${totals.deposit.required.toDecimalString()}` : "—"} />
        </div>
      </Card>

      <Card sx={{ overflow: "hidden", mb: 3 }}>
        <div className="if-row-grid if-row-head" style={{ gridTemplateColumns: "minmax(200px,1fr) 80px 100px 110px" }}>
          <div>Description</div>
          <div>Qty</div>
          <div>Rate</div>
          <div className="if-right">Amount</div>
        </div>
        {quote.items.map((item, index) => (
          <div key={index} className="if-row-grid if-row" style={{ gridTemplateColumns: "minmax(200px,1fr) 80px 100px 110px" }}>
            <div>
              <strong>{item.description}</strong>
              {item.secondaryDescription && <div className="if-muted">{item.secondaryDescription}</div>}
            </div>
            <span>{item.quantity}</span>
            <span>{item.rate}</span>
            <div className="if-right if-amount money">{totals?.lineTotals[index]?.toDecimalString() ?? "0.00"}</div>
          </div>
        ))}
        <div style={{ width: 300, marginLeft: "auto", padding: "0 18px 14px", marginTop: 8 }}>
          <TotalRow label="Subtotal" value={totals?.subtotal.toDecimalString() ?? "0.00"} />
          <TotalRow label="Tax" value={totals?.taxTotal.toDecimalString() ?? "0.00"} />
          <TotalRow label="Total" value={totals?.total.toDecimalString() ?? "0.00"} total />
        </div>
      </Card>

      <Card sx={{ p: 2 }}>
        <div className="if-section-title">Activity</div>
        {activity.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No activity yet.</Typography>
        ) : (
          activity.map((event) => (
            <div key={event.id} className="if-timeline-row">
              <div className="if-dot">✓</div>
              <div>
                <strong>{activityLabel(event)}</strong>
                <div><span>{new Date(event.occurredAt).toLocaleString()}</span></div>
              </div>
            </div>
          ))
        )}
      </Card>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Toast key={toast ?? "none"} message={toast} />
    </div>
  );
}

function AmountBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="if-amount-block">
      <span>{label}</span>
      <strong className="money">{value}</strong>
    </div>
  );
}

function TotalRow({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return (
    <div className={`if-total-row money ${total ? "if-grand" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function activityLabel(event: ActivityEvent): string {
  switch (event.type) {
    case "created":
      return "Quote created";
    case "sent":
      return "Quote sent";
    case "accepted":
      return "Quote accepted";
    case "declined":
      return "Quote declined";
    case "converted":
      return "Converted to invoice";
    default:
      return event.type;
  }
}