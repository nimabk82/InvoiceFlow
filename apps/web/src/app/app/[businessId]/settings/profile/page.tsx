"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiClient, type Business } from "@invoiceflow/api-client";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";

import { Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function BusinessProfilePage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const router = useRouter();

  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
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
        const business: Business = await apiClient.getBusiness(
          businessId,
          token,
        );
        if (!cancelled) {
          setName(business.name ?? "");
          setLegalName(business.legalName ?? "");
          setEmail(business.email ?? "");
          setPhone(business.phone ?? "");
          setWebsite(business.website ?? "");
          setLine1(business.address?.line1 ?? "");
          setLine2(business.address?.line2 ?? "");
          setCity(business.address?.city ?? "");
          setRegion(business.address?.region ?? "");
          setPostalCode(business.address?.postalCode ?? "");
          setCountryCode(business.countryCode ?? "");
          setCurrencyCode(business.currencyCode ?? "");
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load business.",
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
      await apiClient.updateBusiness(
        businessId,
        {
          name,
          countryCode,
          currencyCode,
          legalName: legalName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          website: website || undefined,
          address: {
            line1: line1 || undefined,
            line2: line2 || undefined,
            city: city || undefined,
            region: region || undefined,
            postalCode: postalCode || undefined,
            countryCode,
          },
        },
        token,
      );
      setSaved(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save business.",
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
            Business Profile
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
                  label="Business name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <Input
                  label="Legal name"
                  value={legalName}
                  onChange={(event) => setLegalName(event.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Input
                  label="Phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <Input
                  label="Website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />

                <Typography variant="subtitle1">Address</Typography>
                <Input
                  label="Address line 1"
                  value={line1}
                  onChange={(event) => setLine1(event.target.value)}
                />
                <Input
                  label="Address line 2"
                  value={line2}
                  onChange={(event) => setLine2(event.target.value)}
                />
                <Stack direction="row" spacing={2}>
                  <Input
                    label="City"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                  <Input
                    label="Region"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Input
                    label="Postal code"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                  <Input
                    label="Country code"
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    sx={{ width: 140 }}
                    required
                  />
                </Stack>
                <Input
                  label="Currency code"
                  value={currencyCode}
                  onChange={(event) => setCurrencyCode(event.target.value)}
                  required
                />

                {saved && <Alert severity="success">Business profile saved.</Alert>}

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
