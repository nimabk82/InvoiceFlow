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

export default function PaymentsSettingsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const router = useRouter();

  const [bank, setBank] = useState("");
  const [cheque, setCheque] = useState("");
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
          setBank(settings.bankTransferInstructions ?? "");
          setCheque(settings.chequeInstructions ?? "");
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
          bankTransferInstructions: bank || undefined,
          chequeInstructions: cheque || undefined,
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
            Payments
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
                <Input
                  label="Bank transfer instructions"
                  multiline
                  minRows={3}
                  value={bank}
                  onChange={(event) => setBank(event.target.value)}
                />
                <Input
                  label="Cheque instructions"
                  multiline
                  minRows={3}
                  value={cheque}
                  onChange={(event) => setCheque(event.target.value)}
                />
                {saved && (
                  <Alert severity="success">Payment settings saved.</Alert>
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
