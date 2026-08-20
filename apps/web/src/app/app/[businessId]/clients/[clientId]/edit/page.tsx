"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ApiClient,
  type Client,
  type CreateClientInput,
} from "@invoiceflow/api-client";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

import { ClientForm } from "@/components/clients/ClientForm";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function EditClientPage() {
  const params = useParams<{ businessId: string; clientId: string }>();
  const { businessId, clientId } = params;
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) {
          setError("You must be signed in.");
          setLoading(false);
        }
        return;
      }

      try {
        const result = await apiClient.getClient(
          businessId,
          clientId,
          session.access_token,
        );
        if (!cancelled) {
          setClient(result);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load client.",
          );
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId, clientId]);

  async function handleSubmit(input: CreateClientInput) {
    setError(null);
    setSubmitting(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("You must be signed in to update a client.");
      setSubmitting(false);
      return;
    }

    try {
      await apiClient.updateClient(
        businessId,
        clientId,
        input,
        session.access_token,
      );
      router.push(`/app/${businessId}/clients`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to update client.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Box sx={{ maxWidth: 520, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Client
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !client && <Alert severity="error">{error}</Alert>}

        {!loading && client && (
          <ClientForm
            initial={{
              name: client.name,
              company: client.company,
              emails: client.emails.map((email) => email.address),
              phone: client.phone,
              taxNumber: client.taxNumber,
            }}
            submitLabel="Save changes"
            error={error}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </Box>
    </main>
  );
}
