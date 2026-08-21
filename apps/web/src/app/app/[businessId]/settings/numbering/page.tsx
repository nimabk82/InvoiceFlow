"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ApiClient,
  type BusinessSettings,
} from "@invoiceflow/api-client";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";

import { Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function NumberingSettingsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const router = useRouter();

  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("1");
  const [quotePrefix, setQuotePrefix] = useState("Q-");
  const [nextQuoteNumber, setNextQuoteNumber] = useState("1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      try {
        const settings: BusinessSettings =
          await apiClient.getBusinessSettings(businessId, session.access_token);
        if (!cancelled) {
          setInvoicePrefix(settings.invoicePrefix ?? "INV-");
          setNextInvoiceNumber(String(settings.nextInvoiceNumber ?? 1));
          setQuotePrefix(settings.quotePrefix ?? "Q-");
          setNextQuoteNumber(String(settings.nextQuoteNumber ?? 1));
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error ? caught.message : "Failed to load settings.",
          );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("You must be signed in.");
      setSaving(false);
      return;
    }

    try {
      await apiClient.updateBusinessSettings(
        businessId,
        {
          invoicePrefix: invoicePrefix || undefined,
          nextInvoiceNumber: Number(nextInvoiceNumber) || undefined,
          quotePrefix: quotePrefix || undefined,
          nextQuoteNumber: Number(nextQuoteNumber) || undefined,
        },
        session.access_token,
      );
      setSaved(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <Box sx={{ maxWidth: 640, mx: "auto", px: 2, py: 4 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" component="h1">
            Numbering
          </Typography>
          <Button variant="outlined" onClick={() => router.back()}>
            Back
          </Button>
        </Stack>

        {loading && <Typography variant="body1">Loading…</Typography>}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <Input
                    label="Invoice prefix"
                    value={invoicePrefix}
                    onChange={(event) => setInvoicePrefix(event.target.value)}
                  />
                  <Input
                    label="Next invoice number"
                    type="number"
                    value={nextInvoiceNumber}
                    onChange={(event) => setNextInvoiceNumber(event.target.value)}
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Input
                    label="Quote prefix"
                    value={quotePrefix}
                    onChange={(event) => setQuotePrefix(event.target.value)}
                  />
                  <Input
                    label="Next quote number"
                    type="number"
                    value={nextQuoteNumber}
                    onChange={(event) => setNextQuoteNumber(event.target.value)}
                  />
                </Stack>
                {saved && (
                  <Alert severity="success">Numbering saved.</Alert>
                )}
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </Box>
              </Stack>
            </form>
          </Paper>
        )}
      </Box>
    </main>
  );
}
