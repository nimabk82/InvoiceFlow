"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ApiClient, type CreateClientInput } from "@invoiceflow/api-client";
import { Box, Typography } from "@mui/material";

import { ClientForm } from "@/components/clients/ClientForm";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function NewClientPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(input: CreateClientInput) {
    setError(null);
    setSubmitting(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("You must be signed in to create a client.");
      setSubmitting(false);
      return;
    }

    try {
      await apiClient.createClient(businessId, input, session.access_token);
      router.push(`/app/${businessId}/clients`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to create client.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Box sx={{ maxWidth: 520, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          New Client
        </Typography>
        <ClientForm
          submitLabel="Create client"
          error={error}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </Box>
    </main>
  );
}
