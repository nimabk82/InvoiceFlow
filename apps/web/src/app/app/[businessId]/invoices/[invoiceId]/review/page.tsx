"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiClient, type Invoice } from "@invoiceflow/api-client";
import { normalizeDocumentForRendering } from "@invoiceflow/document-schema";
import { themePresets } from "@invoiceflow/theme-schema";
import type { ThemeConfig } from "@invoiceflow/theme-schema";
import { Alert, Box, Typography } from "@mui/material";

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
  const [newerVersion, setNewerVersion] = useState(false);
  const [adopting, setAdopting] = useState(false);
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

        if (found.themeId && found.themeVersionId) {
          const state = await apiClient.getThemeVersionState(
            businessId,
            found.themeId,
            found.themeVersionId,
            token,
          );
          if (!cancelled) setNewerVersion(state.newerVersionAvailable);
        }
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

  async function adoptLatest() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setError("You must be signed in.");
      return;
    }

    setAdopting(true);
    setError(null);
    try {
      const updated = await apiClient.adoptLatestInvoiceTheme(
        businessId,
        invoiceId,
        token,
      );
      setInvoice(updated);
      setNewerVersion(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to adopt latest theme.",
      );
    } finally {
      setAdopting(false);
    }
  }

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
    <div>
      <div className="if-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Select
            label="Theme"
            value={preset}
            onValueChange={(value) => setPreset(value as PresetName)}
            options={presetNames.map((name) => ({
              value: name,
              label: name.charAt(0).toUpperCase() + name.slice(1),
            }))}
            sx={{ minWidth: 160 }}
          />
          <Typography variant="body2" color="text.secondary">
            Theme changes appearance only — financial values are unchanged.
          </Typography>
        </div>
        <Button variant="outlined" onClick={() => router.back()}>
          Back to Edit
        </Button>
      </div>

      {newerVersion && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={() => void adoptLatest()} disabled={adopting}>
              {adopting ? "Adopting…" : "Adopt latest"}
            </Button>
          }
        >
          A newer version of this invoice&apos;s theme is available.
        </Alert>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 330px",
          gap: 0,
          background: "#EEF2F6",
          border: "1px solid #E4E7EC",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 28, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
          <DocumentPaper document={renderable} theme={theme} />
        </div>

        <div style={{ padding: 22, background: "#fff", borderLeft: "1px solid #E4E7EC" }}>
          <h3 style={{ fontSize: 18, margin: "0 0 20px", color: "#101828" }}>Invoice Summary</h3>
          <div className="if-eyebrow" style={{ marginBottom: 4 }}>Client</div>
          <strong style={{ fontSize: 14, color: "#101828" }}>
            {invoice.clientSnapshot.displayName}
          </strong>
          <div style={{ marginTop: 18 }}>
            <div className="if-eyebrow" style={{ marginBottom: 4 }}>Total</div>
            <div className="big money" style={{ fontSize: 26, fontWeight: 800, margin: "4px 0 18px", color: "#101828" }}>
              {renderable.total}
            </div>
          </div>
          {renderable.deposit && (
            <div>
              <div className="if-eyebrow" style={{ marginBottom: 4 }}>Deposit due</div>
              <strong className="money" style={{ color: "#2563EB" }}>{renderable.deposit.required}</strong>
            </div>
          )}
          <div className="if-actions" style={{ flexDirection: "column", marginTop: 24 }}>
            <Button
              onClick={() => router.push(`/app/${businessId}/invoices/${invoiceId}/send`)}
              sx={{ width: "100%" }}
            >
              Send Invoice
            </Button>
            <Button variant="outlined" sx={{ width: "100%" }}>
              Download PDF
            </Button>
            <Button variant="text" onClick={() => router.back()} sx={{ width: "100%" }}>
              Back to Edit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
