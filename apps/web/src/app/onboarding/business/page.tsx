"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiClient } from "@invoiceflow/api-client";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";

import { Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl:
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function OnboardingBusinessPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be signed in to create a business.");
        setSubmitting(false);
        return;
      }

      await apiClient.createBusiness(
        { name, countryCode, currencyCode },
        session.access_token,
      );

      router.push("/");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to create the business.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          px: 2,
        }}
      >
        <Paper elevation={2} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
          <Stack spacing={3}>
            <Typography variant="h5" component="h1">
              Create your business
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start with the essentials. You can configure the rest later.
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <Input
                  label="Business name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <Input
                  label="Country"
                  value={countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                  placeholder="CA"
                  required
                />
                <Input
                  label="Currency"
                  value={currencyCode}
                  onChange={(event) => setCurrencyCode(event.target.value)}
                  placeholder="CAD"
                  required
                />
                {error && <Alert severity="error">{error}</Alert>}
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating…" : "Create business"}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Box>
    </main>
  );
}
