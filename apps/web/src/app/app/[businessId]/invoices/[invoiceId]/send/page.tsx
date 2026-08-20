"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ApiClient,
  type Invoice,
  type SendInvoiceInput,
} from "@invoiceflow/api-client";
import { calculateDocumentTotals } from "@invoiceflow/calculations";
import { validateDocumentForSend } from "@invoiceflow/validation";
import {
  Alert,
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";

import { Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

type EmailFieldProps = {
  label: string;
  emails: string[];
  onChange: (emails: string[]) => void;
};

function EmailField({ label, emails, onChange }: EmailFieldProps) {
  const [draft, setDraft] = useState("");

  function addPending() {
    const candidates = draft.split(",").map((e) => e.trim()).filter(Boolean);
    if (candidates.length > 0) {
      onChange([...emails, ...candidates]);
      setDraft("");
    }
  }

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{label}</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {emails.map((email) => (
          <Chip
            key={email}
            label={email}
            onDelete={() => onChange(emails.filter((e) => e !== email))}
            deleteIcon={<CancelIcon />}
          />
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <Input
          label={`Add ${label} email`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addPending();
            }
          }}
        />
        <IconButton aria-label="Add email" onClick={addPending}>
          <AddIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}

export default function SendInvoicePage() {
  const params = useParams<{ businessId: string; invoiceId: string }>();
  const { businessId, invoiceId } = params;
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

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
        if (!cancelled) {
          setInvoice(found);
          const defaultTo = found.clientSnapshot.emails ?? [];
          setTo([...defaultTo]);
          setSubject(`Invoice ${found.number} from ${found.businessSnapshot.displayName}`);
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

  async function handleSend() {
    setError(null);
    setEmailErrors([]);

    const validation = validateDocumentForSend({ to: [...to, ...cc, ...bcc] });
    if (!validation.valid) {
      setEmailErrors(validation.issues.map((issue) => issue.message));
      return;
    }

    if (to.length === 0) {
      setEmailErrors(["Add at least one recipient."]);
      return;
    }

    setSending(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setError("You must be signed in.");
      setSending(false);
      return;
    }

    try {
      const input: SendInvoiceInput = {
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject,
        message: message || undefined,
      };
      await apiClient.sendInvoice(businessId, invoiceId, input, token);
      router.push(`/app/${businessId}/invoices/${invoiceId}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to send invoice.",
      );
      setSending(false);
    }
  }

  if (error && !invoice) {
    return (
      <main>
        <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main>
        <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
          <Typography variant="body1">Loading…</Typography>
        </Box>
      </main>
    );
  }

  return (
    <main>
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
        >
          <Typography variant="h4" component="h1">
            Send Invoice
          </Typography>
          <Button variant="outlined" onClick={() => router.back()}>
            Back
          </Button>
        </Stack>

        {totals && (
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={4}>
              <Typography variant="body1">
                Total: {totals.total.toDecimalString()}
              </Typography>
              {totals.deposit && (
                <Typography variant="body1">
                  Deposit due: {totals.deposit.required.toDecimalString()}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                PDF attachment included
              </Typography>
            </Stack>
          </Paper>
        )}

        <Paper elevation={1} sx={{ p: 3 }}>
          <Stack spacing={3}>
            <EmailField label="To" emails={to} onChange={setTo} />
            <EmailField label="CC" emails={cc} onChange={setCc} />
            <EmailField label="BCC" emails={bcc} onChange={setBcc} />
            <Input
              label="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
            <Input
              label="Message"
              multiline
              minRows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />

            {emailErrors.length > 0 && (
              <Alert severity="warning">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {emailErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? "Sending…" : "Send Invoice"}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </main>
  );
}
