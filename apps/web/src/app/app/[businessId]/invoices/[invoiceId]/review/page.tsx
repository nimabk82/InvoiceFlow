"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiClient, type Invoice } from "@invoiceflow/api-client";
import { normalizeDocumentForRendering } from "@invoiceflow/document-schema";
import { themePresets } from "@invoiceflow/theme-schema";
import type { ThemeConfig } from "@invoiceflow/theme-schema";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";

import { Button, Select } from "@/components/ui";
import { DocumentPaper } from "@/components/documents/DocumentPaper";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

const presetNames = ["clean", "modern", "minimal", "blank"] as const;
type PresetName = (typeof presetNames)[number];

export default function InvoiceReviewPage() {
  const params = useParams<{ businessId: string; invoiceId: string }>();
  const { businessId, invoiceId } = params;
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetName>("clean");

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
        if (!cancelled) setInvoice(found);
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

  const renderable = useMemo(() => {
    if (!invoice) return null;
    try {
      return normalizeDocumentForRendering({
        kind: "invoice",
        currencyCode: invoice.currencyCode,
        themeVersionId: invoice.themeVersionId ?? "",
        business: {
          displayName: invoice.businessSnapshot.displayName,
          legalName: invoice.businessSnapshot.legalName,
          email: invoice.businessSnapshot.email,
          phone: invoice.businessSnapshot.phone,
          website: invoice.businessSnapshot.website,
          address: invoice.businessSnapshot.address,
          taxNumbers: invoice.businessSnapshot.taxNumbers
            ? [...invoice.businessSnapshot.taxNumbers]
            : undefined,
          logoAssetId: invoice.businessSnapshot.logoAssetId,
        },
        client: {
          displayName: invoice.clientSnapshot.displayName,
          emails: [...invoice.clientSnapshot.emails],
          phone: invoice.clientSnapshot.phone,
          address: invoice.clientSnapshot.address,
          taxNumber: invoice.clientSnapshot.taxNumber,
        },
        number: invoice.number,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        poNumber: invoice.poNumber,
        items: invoice.items.map((item) => ({
          description: item.description,
          secondaryDescription: item.secondaryDescription,
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

  const theme: ThemeConfig = themePresets[preset];

  if (error) {
    return (
      <main>
        <Box sx={{ maxWidth: 900, mx: "auto", px: 2, py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </main>
    );
  }

  if (!invoice || !renderable) {
    return (
      <main>
        <Box sx={{ maxWidth: 900, mx: "auto", px: 2, py: 4 }}>
          <Typography variant="body1">Loading…</Typography>
        </Box>
      </main>
    );
  }

  return (
    <main>
      <Box sx={{ maxWidth: 900, mx: "auto", px: 2, py: 4 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" component="h1">
            Review Invoice
          </Typography>
          <Button variant="outlined" onClick={() => router.back()}>
            Back to Edit
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
          <Select
            label="Theme"
            value={preset}
            onValueChange={(value) => setPreset(value as PresetName)}
            options={presetNames.map((name) => ({
              value: name,
              label: name.charAt(0).toUpperCase() + name.slice(1),
            }))}
          />
          <Typography variant="body2" color="text.secondary">
            Theme changes appearance only — financial values are unchanged.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
          <Paper
            elevation={1}
            sx={{ flexGrow: 1, background: "#eef2f6", p: 2 }}
          >
            <DocumentPaper document={renderable} theme={theme} />
          </Paper>

          <Paper elevation={1} sx={{ width: 260, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Invoice Summary
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Client
            </Typography>
            <Typography variant="body1">
              {invoice.clientSnapshot.displayName}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Total
            </Typography>
            <Typography variant="h5">
              {invoice.currencyCode} {renderable.total}
            </Typography>
            <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                onClick={() =>
                  router.push(`/app/${businessId}/invoices/${invoiceId}/send`)
                }
              >
                Continue to Send
              </Button>
            </Box>
          </Paper>
        </Stack>
      </Box>
    </main>
  );
}
