"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ApiClient,
  type ThemeDetail,
} from "@invoiceflow/api-client";
import { normalizeDocumentForRendering } from "@invoiceflow/document-schema";
import type { RenderableDocument } from "@invoiceflow/document-schema";
import { themePresets, type ThemeConfig } from "@invoiceflow/theme-schema";
import { diagnoseRender, renderDocumentSections, paginateDocument } from "@invoiceflow/renderer";
import { Alert, Box, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";

import { Button, Input, Select } from "@/components/ui";
import { DocumentPaper } from "@/components/documents/DocumentPaper";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

const SECTION_LABELS: Record<string, string> = {
  header: "Header",
  business: "Business Information",
  "document-info": "Document Information",
  "bill-to": "Bill To",
  items: "Items",
  totals: "Totals",
  deposit: "Deposit",
  payment: "Payment Instructions",
  notes: "Notes",
  terms: "Terms",
  footer: "Footer",
};

const PROTECTED_ORDER = ["items", "totals", "deposit"];

type HistoryEntry = { config: ThemeConfig; label: string };

export default function ThemeBuilderPage() {
  const params = useParams<{ businessId: string; themeId: string }>();
  const { businessId, themeId } = params;
  const router = useRouter();

  const [detail, setDetail] = useState<ThemeDetail | null>(null);
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
        const found = await apiClient.getTheme(businessId, themeId, token);
        if (!cancelled) setDetail(found);

        const latest = found.versions[found.versions.length - 1];
        const initial: ThemeConfig =
          (latest?.config as unknown as ThemeConfig | undefined) ??
          themePresets.clean;
        if (!cancelled) {
          setConfig(initial);
          setHistory([{ config: initial, label: "Loaded" }]);
          setHistoryIndex(0);
        }
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error ? caught.message : "Failed to load theme.",
          );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId, themeId]);

  function updateConfig(patch: Partial<ThemeConfig>) {
    if (!config) return;
    commit({ ...config, ...patch });
  }

  function updateSection(id: string, enabled: boolean) {
    if (!config) return;
    commit({
      ...config,
      sections: config.sections.map((section) =>
        section.id === id ? { ...section, enabled } : section,
      ),
    });
  }

  function moveSection(id: string, direction: -1 | 1) {
    if (!config) return;
    const index = config.sections.findIndex((section) => section.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= config.sections.length) return;

    const next = [...config.sections];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);

    if (violatesProtectedOrder(next.map((section) => section.id))) {
      return;
    }

    commit({ ...config, sections: next });
  }

  function violatesProtectedOrder(ids: string[]): boolean {
    const itemsIndex = ids.indexOf("items");
    const totalsIndex = ids.indexOf("totals");
    const depositIndex = ids.indexOf("deposit");
    const footerIndex = ids.indexOf("footer");

    if (itemsIndex === -1 || totalsIndex === -1 || depositIndex === -1) {
      return true;
    }
    if (!(itemsIndex < totalsIndex && totalsIndex < depositIndex)) return true;
    if (footerIndex !== -1 && footerIndex !== ids.length - 1) return true;
    return false;
  }

  function commit(nextConfig: ThemeConfig) {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({ config: nextConfig, label: "Edit" });
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setConfig(nextConfig);
    setSaved(false);
  }

  function undo() {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setConfig(history[nextIndex].config);
    setSaved(false);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setConfig(history[nextIndex].config);
    setSaved(false);
  }

  async function save() {
    if (!config) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setError("You must be signed in.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await apiClient.saveThemeConfig(
        businessId,
        themeId,
        config as unknown as Record<string, unknown>,
        token,
      );
      setDetail(updated);
      setSaved(true);
      const latest = updated.versions[updated.versions.length - 1];
      if (latest) {
        const asConfig = latest.config as unknown as ThemeConfig;
        setHistory([{ config: asConfig, label: "Saved" }]);
        setHistoryIndex(0);
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save theme.",
      );
    } finally {
      setSaving(false);
    }
  }

  const previewDocument: RenderableDocument | null = useMemo(() => {
    return normalizeDocumentForRendering({
      kind: "invoice",
      currencyCode: "CAD",
      themeVersionId: "preview",
      business: {
        displayName: "Acme Inc",
        legalName: "Acme Inc.",
        email: "billing@acme.com",
        phone: "555-0100",
        website: "acme.com",
        taxNumbers: [],
      },
      client: {
        displayName: "Client Co",
        emails: ["client@example.com"],
        address: {
          line1: "123 Main St",
          city: "Toronto",
          region: "ON",
          postalCode: "M5V 2T6",
          countryCode: "CA",
        },
      },
      number: "INV-101",
      issueDate: "2026-08-22",
      dueDate: "2026-09-21",
      items: [
        {
          description: "Website design",
          secondaryDescription: "Home page + contact",
          quantity: "1",
          rate: "5000",
          appliedTaxes: [{ name: "HST", rate: "13" }],
        },
        {
          description: "Development",
          quantity: "20",
          rate: "150",
          appliedTaxes: [{ name: "HST", rate: "13" }],
        },
      ],
      depositTerms: { type: "percentage", value: "30" },
    });
  }, []);

  const diagnostics = useMemo(() => {
    if (!config || !previewDocument) return [];
    const ctx = { output: "preview" as const, locale: "en-CA", timezone: "UTC" };
    const sections = renderDocumentSections({
      document: previewDocument,
      theme: config,
      renderContext: ctx,
    }).sections;
    const { pages } = paginateDocument({
      document: previewDocument,
      theme: config,
      renderContext: ctx,
    });
    return diagnoseRender({
      document: previewDocument,
      theme: config,
      sections,
      pages,
    });
  }, [config, previewDocument]);

  if (error) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", px: 2, py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!config || !detail || !previewDocument) {
    return <Typography variant="body1">Loading…</Typography>;
  }

  const currentVersion = detail.versions[detail.versions.length - 1];
  const versionLabel = currentVersion
    ? `Version ${currentVersion.version}`
    : "Draft";

  return (
    <div>
      <div className="if-toolbar">
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#101828" }}>
            {detail.theme.name}
          </h2>
          <span style={{ fontSize: 12, color: "#667085" }}>
            {versionLabel} · {history.length} changes
          </span>
        </div>
        <div className="if-actions">
          <Button variant="outlined" onClick={undo} disabled={historyIndex <= 0}>
            Undo
          </Button>
          <Button
            variant="outlined"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            Redo
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save Theme"}
          </Button>
          <Button variant="text" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Theme saved as a new immutable version.
        </Alert>
      )}
      {diagnostics.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Render diagnostics</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            {diagnostics.map((diagnostic) => (
              <li key={diagnostic.code}>
                {diagnostic.code}: {diagnostic.message}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0,1fr) 320px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Structure */}
        <div className="if-card" style={{ padding: 16 }}>
          <div className="if-eyebrow" style={{ marginBottom: 10 }}>
            Structure
          </div>
          <Stack spacing={1}>
            {config.sections.map((section, index) => (
              <div key={section.id} style={{ border: "1px solid #E4E7EC", borderRadius: 10, padding: "8px 10px" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={section.enabled}
                      onChange={(event) => updateSection(section.id, event.target.checked)}
                    />
                  }
                  label={SECTION_LABELS[section.id] ?? section.id}
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: 12, fontWeight: 600 } }}
                />
                <div style={{ display: "flex", gap: 6, paddingLeft: 30 }}>
                  <Button
                    variant="text"
                    size="small"
                    disabled={index === 0 || PROTECTED_ORDER.includes(section.id)}
                    onClick={() => moveSection(section.id, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    disabled={
                      index === config.sections.length - 1 ||
                      PROTECTED_ORDER.includes(section.id)
                    }
                    onClick={() => moveSection(section.id, 1)}
                  >
                    ↓
                  </Button>
                </div>
              </div>
            ))}
          </Stack>
        </div>

        {/* Live preview */}
        <div style={{ background: "#EEF2F6", border: "1px solid #E4E7EC", borderRadius: 16, padding: 20, display: "flex", justifyContent: "center" }}>
          <DocumentPaper document={previewDocument} theme={config} />
        </div>

        {/* Properties */}
        <div className="if-card" style={{ padding: 16 }}>
          <div className="if-eyebrow" style={{ marginBottom: 10 }}>
            Properties
          </div>
          <Stack spacing={3}>
            <PropertyGroup label="Page">
              <Select
                label="Size"
                value={config.page.size}
                onValueChange={(value) => updateConfig({ page: { ...config.page, size: value as ThemeConfig["page"]["size"] } })}
                options={[
                  { value: "letter", label: "Letter" },
                  { value: "a4", label: "A4" },
                ]}
              />
              <Select
                label="Margin"
                value={config.page.margin}
                onValueChange={(value) => updateConfig({ page: { ...config.page, margin: value as ThemeConfig["page"]["margin"] } })}
                options={[
                  { value: "compact", label: "Compact" },
                  { value: "standard", label: "Standard" },
                  { value: "spacious", label: "Spacious" },
                ]}
              />
              <Select
                label="Border"
                value={config.page.border}
                onValueChange={(value) => updateConfig({ page: { ...config.page, border: value as ThemeConfig["page"]["border"] } })}
                options={[
                  { value: "none", label: "None" },
                  { value: "thin", label: "Thin" },
                  { value: "accent", label: "Accent" },
                ]}
              />
              <Input
                label="Background color"
                value={config.page.backgroundColor}
                onChange={(event) => updateConfig({ page: { ...config.page, backgroundColor: event.target.value } })}
              />
            </PropertyGroup>

            <PropertyGroup label="Brand">
              <Input
                label="Primary color"
                value={config.brand.primaryColor}
                onChange={(event) => updateConfig({ brand: { ...config.brand, primaryColor: event.target.value } })}
              />
              <Input
                label="Secondary color"
                value={config.brand.secondaryColor ?? ""}
                onChange={(event) => updateConfig({ brand: { ...config.brand, secondaryColor: event.target.value || undefined } })}
              />
              <Select
                label="Logo size"
                value={config.brand.logoSize ?? "medium"}
                onValueChange={(value) => updateConfig({ brand: { ...config.brand, logoSize: value as ThemeConfig["brand"]["logoSize"] } })}
                options={[
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" },
                ]}
              />
            </PropertyGroup>

            <PropertyGroup label="Typography">
              <Select
                label="Font"
                value={config.typography.font}
                onValueChange={(value) => updateConfig({ typography: { ...config.typography, font: value } })}
                options={[
                  { value: "Inter", label: "Inter" },
                  { value: "Montserrat", label: "Montserrat" },
                  { value: "Lato", label: "Lato" },
                  { value: "Open Sans", label: "Open Sans" },
                  { value: "Georgia", label: "Georgia" },
                ]}
              />
              <Select
                label="Heading scale"
                value={config.typography.headingScale}
                onValueChange={(value) => updateConfig({ typography: { ...config.typography, headingScale: value as ThemeConfig["typography"]["headingScale"] } })}
                options={[
                  { value: "compact", label: "Compact" },
                  { value: "comfortable", label: "Comfortable" },
                ]}
              />
            </PropertyGroup>

            <PropertyGroup label="Header">
              <Select
                label="Layout"
                value={config.header.layout}
                onValueChange={(value) => updateConfig({ header: { layout: value as ThemeConfig["header"]["layout"] } })}
                options={[
                  { value: "classic", label: "Classic" },
                  { value: "split", label: "Split" },
                  { value: "centered", label: "Centered" },
                  { value: "minimal", label: "Minimal" },
                ]}
              />
            </PropertyGroup>

            <PropertyGroup label="Bill To">
              <Select
                label="Style"
                value={config.billTo.style}
                onValueChange={(value) => updateConfig({ billTo: { style: value as ThemeConfig["billTo"]["style"] } })}
                options={[
                  { value: "plain", label: "Plain" },
                  { value: "soft", label: "Soft" },
                  { value: "bordered", label: "Bordered" },
                  { value: "accent-edge", label: "Accent Edge" },
                ]}
              />
            </PropertyGroup>

            <PropertyGroup label="Items">
              <Select
                label="Table header"
                value={config.items.headerStyle}
                onValueChange={(value) => updateConfig({ items: { ...config.items, headerStyle: value as ThemeConfig["items"]["headerStyle"] } })}
                options={[
                  { value: "filled", label: "Filled" },
                  { value: "soft", label: "Soft" },
                  { value: "line", label: "Line" },
                  { value: "minimal", label: "Minimal" },
                ]}
              />
              <Select
                label="Row style"
                value={config.items.rowStyle}
                onValueChange={(value) => updateConfig({ items: { ...config.items, rowStyle: value as ThemeConfig["items"]["rowStyle"] } })}
                options={[
                  { value: "plain", label: "Plain" },
                  { value: "separators", label: "Separators" },
                  { value: "striped", label: "Striped" },
                ]}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={config.items.showQuantity}
                    onChange={(event) => updateConfig({ items: { ...config.items, showQuantity: event.target.checked } })}
                  />
                }
                label="Show quantity"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={config.items.showRate}
                    onChange={(event) => updateConfig({ items: { ...config.items, showRate: event.target.checked } })}
                  />
                }
                label="Show rate"
              />
            </PropertyGroup>

            <PropertyGroup label="Totals">
              <Select
                label="Layout"
                value={config.totals.layout}
                onValueChange={(value) => updateConfig({ totals: { ...config.totals, layout: value as ThemeConfig["totals"]["layout"] } })}
                options={[
                  { value: "right", label: "Right" },
                  { value: "full-width", label: "Full Width" },
                  { value: "boxed", label: "Boxed" },
                ]}
              />
              <Select
                label="Emphasis"
                value={config.totals.emphasis}
                onValueChange={(value) => updateConfig({ totals: { ...config.totals, emphasis: value as ThemeConfig["totals"]["emphasis"] } })}
                options={[
                  { value: "bold", label: "Bold" },
                  { value: "accent-line", label: "Accent Line" },
                  { value: "soft-accent", label: "Soft Accent" },
                ]}
              />
            </PropertyGroup>

            <PropertyGroup label="Deposit">
              <Select
                label="Style"
                value={config.deposit.style}
                onValueChange={(value) => updateConfig({ deposit: { style: value as ThemeConfig["deposit"]["style"] } })}
                options={[
                  { value: "plain", label: "Plain" },
                  { value: "highlight", label: "Highlight" },
                  { value: "boxed", label: "Boxed" },
                  { value: "accent-edge", label: "Accent Edge" },
                ]}
              />
            </PropertyGroup>

            <PropertyGroup label="Footer">
              <Select
                label="Alignment"
                value={config.footer.alignment}
                onValueChange={(value) => updateConfig({ footer: { ...config.footer, alignment: value as ThemeConfig["footer"]["alignment"] } })}
                options={[
                  { value: "left", label: "Left" },
                  { value: "center", label: "Center" },
                  { value: "right", label: "Right" },
                ]}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={config.footer.showBusinessName}
                    onChange={(event) => updateConfig({ footer: { ...config.footer, showBusinessName: event.target.checked } })}
                  />
                }
                label="Business name"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={config.footer.showWebsite}
                    onChange={(event) => updateConfig({ footer: { ...config.footer, showWebsite: event.target.checked } })}
                  />
                }
                label="Website"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={config.footer.showPageNumber}
                    onChange={(event) => updateConfig({ footer: { ...config.footer, showPageNumber: event.target.checked } })}
                  />
                }
                label="Page number"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={config.footer.showDivider}
                    onChange={(event) => updateConfig({ footer: { ...config.footer, showDivider: event.target.checked } })}
                  />
                }
                label="Divider"
              />
              <Input
                label="Custom footer text"
                value={config.footer.customText ?? ""}
                onChange={(event) => updateConfig({ footer: { ...config.footer, customText: event.target.value || undefined } })}
              />
            </PropertyGroup>
          </Stack>
        </div>
      </div>
    </div>
  );
}

function PropertyGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          color: "#98A2B3",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <Stack spacing={2}>{children}</Stack>
    </div>
  );
}