"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ApiClient,
  type DocumentDefaults,
} from "@invoiceflow/api-client";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";

import { Button, Input, Select } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function DocumentDefaultsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const router = useRouter();

  const [defaultDueRule, setDefaultDueRule] = useState("");
  const [defaultNotes, setDefaultNotes] = useState("");
  const [defaultTerms, setDefaultTerms] = useState("");
  const [defaultTaxIds, setDefaultTaxIds] = useState("");
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
      const token = session?.access_token ?? null;

      if (!token) {
        if (!cancelled) {
          setError("You must be signed in.");
          setLoading(false);
        }
        return;
      }

      try {
        const defaults: DocumentDefaults = await apiClient.getDocumentDefaults(
          businessId,
          token,
        );
        if (!cancelled) {
          setDefaultDueRule(defaults.defaultDueRule ?? "");
          setDefaultNotes(defaults.defaultNotes ?? "");
          setDefaultTerms(defaults.defaultTerms ?? "");
          setDefaultTaxIds((defaults.defaultTaxIds ?? []).join(","));
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Failed to load defaults.",
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setError("You must be signed in.");
      setSaving(false);
      return;
    }

    try {
      await apiClient.updateDocumentDefaults(
        businessId,
        {
          defaultDueRule: defaultDueRule || undefined,
          defaultNotes: defaultNotes || undefined,
          defaultTerms: defaultTerms || undefined,
          defaultTaxIds: defaultTaxIds
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
        token,
      );
      setSaved(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save defaults.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" component="h1">
            Document Defaults
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
                <Select
                  label="Default due date"
                  value={defaultDueRule}
                  onValueChange={setDefaultDueRule}
                  options={[
                    { value: "", label: "No default" },
                    { value: "on_receipt", label: "On receipt" },
                    { value: "days_7", label: "7 days" },
                    { value: "days_15", label: "15 days" },
                    { value: "days_30", label: "30 days" },
                    { value: "days_60", label: "60 days" },
                  ]}
                />
                <Input
                  label="Default notes"
                  multiline
                  minRows={3}
                  value={defaultNotes}
                  onChange={(event) => setDefaultNotes(event.target.value)}
                />
                <Input
                  label="Default payment terms"
                  multiline
                  minRows={3}
                  value={defaultTerms}
                  onChange={(event) => setDefaultTerms(event.target.value)}
                />
                <Input
                  label="Default tax IDs (comma-separated)"
                  value={defaultTaxIds}
                  onChange={(event) => setDefaultTaxIds(event.target.value)}
                />

                {saved && <Alert severity="success">Document defaults saved.</Alert>}

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
