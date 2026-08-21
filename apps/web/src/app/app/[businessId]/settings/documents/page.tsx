"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiClient, type Tax } from "@invoiceflow/api-client";
import { Alert, Box, Stack, Typography } from "@mui/material";

import { Button, Input, Select } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function DocumentDefaultsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const [defaultDueRule, setDefaultDueRule] = useState("");
  const [defaultNotes, setDefaultNotes] = useState("");
  const [defaultTerms, setDefaultTerms] = useState("");
  const [defaultTaxId, setDefaultTaxId] = useState("");
  const [taxes, setTaxes] = useState<Tax[]>([]);
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
        const [defaults, taxList] = await Promise.all([
          apiClient.getDocumentDefaults(businessId, token),
          apiClient.listTaxes(businessId, token),
        ]);
        if (!cancelled) {
          setDefaultDueRule(defaults.defaultDueRule ?? "");
          setDefaultNotes(defaults.defaultNotes ?? "");
          setDefaultTerms(defaults.defaultTerms ?? "");
          setDefaultTaxId(defaults.defaultTaxIds?.[0] ?? "");
          setTaxes([...taxList]);
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
          defaultTaxIds: defaultTaxId ? [defaultTaxId] : undefined,
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
    <div>
      <h2>Document Defaults</h2>

      {loading && <Typography variant="body1">Loading…</Typography>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <div className="if-settings-section">
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <Select
                  label="Default invoice due date"
                  value={defaultDueRule}
                  onValueChange={setDefaultDueRule}
                  options={[
                    { value: "", label: "No default" },
                    { value: "on_receipt", label: "On receipt" },
                    { value: "days_7", label: "7 days after issue" },
                    { value: "days_15", label: "15 days after issue" },
                    { value: "days_30", label: "30 days after issue" },
                    { value: "days_60", label: "60 days after issue" },
                  ]}
                  sx={{ flexGrow: 1 }}
                />
                <Select
                  label="Default tax"
                  value={defaultTaxId}
                  onValueChange={setDefaultTaxId}
                  options={[
                    { value: "", label: "No tax" },
                    ...taxes.map((tax) => ({
                      value: tax.id,
                      label: `${tax.name} ${tax.rate}%`,
                    })),
                  ]}
                  sx={{ flexGrow: 1 }}
                />
              </Stack>
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

              {saved && <Alert severity="success">Document defaults saved.</Alert>}

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </Box>
            </Stack>
          </form>
        </div>
      )}
    </div>
  );
}
