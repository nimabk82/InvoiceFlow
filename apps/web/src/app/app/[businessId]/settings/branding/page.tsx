"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ApiClient,
  type BusinessSettings,
} from "@invoiceflow/api-client";
import { Alert, Box, Stack, Typography } from "@mui/material";

import { Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function BrandingSettingsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const [accentColor, setAccentColor] = useState("#2563EB");
  const [style, setStyle] = useState("clean");
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
          setAccentColor(settings.accentColor ?? "#2563EB");
          setStyle(settings.style ?? "clean");
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
        { accentColor, style },
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
    <div>
      <h2>Branding</h2>

        {loading && <Typography variant="body1">Loading…</Typography>}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <div className="if-settings-section">
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <Input
                  label="Accent color"
                  type="color"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                  sx={{ width: 120 }}
                />
                <Typography variant="subtitle2">Invoice style</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
                  {["clean", "modern", "minimal"].map((option) => (
                    <Box
                      key={option}
                      onClick={() => setStyle(option)}
                      sx={{
                        height: 100,
                        borderRadius: 2,
                        border: 1,
                        borderColor: style === option ? "primary.main" : "divider",
                        color: style === option ? "primary.main" : "text.primary",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        background: "surface",
                      }}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                      {style === option ? " ✓" : ""}
                    </Box>
                  ))}
                </Box>
                {saved && <Alert severity="success">Branding saved.</Alert>}
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
