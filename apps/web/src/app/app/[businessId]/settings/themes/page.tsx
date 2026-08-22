"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ApiClient,
  type DocumentTheme,
} from "@invoiceflow/api-client";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";

import { Button, Dialog, Input, Select } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

const PRESET_OPTIONS = [
  { value: "clean", label: "Clean" },
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
  { value: "blank", label: "Blank Structured" },
];

export default function DocumentThemesPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const [themes, setThemes] = useState<DocumentTheme[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [createPreset, setCreatePreset] = useState("clean");
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  const [renameTarget, setRenameTarget] = useState<DocumentTheme | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

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
        const list = await apiClient.listThemes(businessId, token, includeArchived);
        if (!cancelled) setThemes([...list]);
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error ? caught.message : "Failed to load themes.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId, includeArchived, reloadKey]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreating(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setError("You must be signed in.");
      setCreating(false);
      return;
    }

    try {
      await apiClient.createTheme(
        businessId,
        {
          preset: createPreset,
          name: createName.trim() || undefined,
          appliesToInvoice: true,
          appliesToQuote: false,
        },
        token,
      );
      setCreateOpen(false);
      setCreateName("");
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to create theme.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!renameTarget) return;
    setError(null);
    setRenaming(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setError("You must be signed in.");
      setRenaming(false);
      return;
    }

    try {
      await apiClient.updateTheme(
        businessId,
        renameTarget.id,
        { name: renameName.trim() },
        token,
      );
      setRenameTarget(null);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to rename theme.",
      );
    } finally {
      setRenaming(false);
    }
  }

  async function runAction(
    theme: DocumentTheme,
    action: "duplicate" | "archive" | "restore" | "set-invoice" | "set-quote",
  ) {
    setBusyId(theme.id);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setError("You must be signed in.");
      setBusyId(null);
      return;
    }

    try {
      switch (action) {
        case "duplicate":
          await apiClient.duplicateTheme(businessId, theme.id, token);
          break;
        case "archive":
          await apiClient.archiveTheme(businessId, theme.id, token);
          break;
        case "restore":
          await apiClient.restoreTheme(businessId, theme.id, token);
          break;
        case "set-invoice":
          await apiClient.updateTheme(
            businessId,
            theme.id,
            { appliesToInvoice: true, appliesToQuote: false },
            token,
          );
          break;
        case "set-quote":
          await apiClient.updateTheme(
            businessId,
            theme.id,
            { appliesToInvoice: false, appliesToQuote: true },
            token,
          );
          break;
      }
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Action failed.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const activeThemes = themes.filter((theme) => !theme.archivedAt);
  const archivedThemes = themes.filter((theme) => theme.archivedAt);

  return (
    <div>
      <h2>Document Themes</h2>
      <p className="if-section-title">
        Themes control how invoices and quotes look. Choose a preset to get
        started, then customize it in the Theme Builder.
      </p>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <Button onClick={() => setCreateOpen(true)}>+ New Theme</Button>
        <label style={{ fontSize: 13, color: "#667085", display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          Show archived
        </label>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && activeThemes.length === 0 && (
        <Typography variant="body1" color="text.secondary">
          No themes yet. Create one from a preset to get started.
        </Typography>
      )}

      {!loading && activeThemes.length > 0 && (
        <div className="if-entity-grid">
          {activeThemes.map((theme) => (
            <div key={theme.id} className="if-entity">
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <h3>{theme.name}</h3>
                  <p>
                    {theme.appliesToInvoice ? "Invoice default" : ""}
                    {theme.appliesToInvoice && theme.appliesToQuote ? " · " : ""}
                    {theme.appliesToQuote ? "Quote default" : ""}
                    {!theme.appliesToInvoice && !theme.appliesToQuote ? "Not a default" : ""}
                  </p>
                </div>
              </Box>
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Link
                  href={`/app/${businessId}/settings/themes/${theme.id}/edit`}
                  style={{ textDecoration: "none" }}
                >
                  <Button variant="outlined" size="small" sx={{ width: "100%" }}>
                    Edit in Theme Builder
                  </Button>
                </Link>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={busyId === theme.id}
                  onClick={() => setRenameTarget(theme)}
                >
                  Rename
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={busyId === theme.id}
                  onClick={() => void runAction(theme, "duplicate")}
                >
                  Duplicate
                </Button>
                {!theme.appliesToInvoice && (
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={busyId === theme.id}
                    onClick={() => void runAction(theme, "set-invoice")}
                  >
                    Set as Invoice default
                  </Button>
                )}
                {!theme.appliesToQuote && (
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={busyId === theme.id}
                    onClick={() => void runAction(theme, "set-quote")}
                  >
                    Set as Quote default
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  disabled={busyId === theme.id}
                  onClick={() => void runAction(theme, "archive")}
                >
                  Archive
                </Button>
              </Stack>
            </div>
          ))}
        </div>
      )}

      {includeArchived && archivedThemes.length > 0 && (
        <>
          <h3 style={{ marginTop: 32 }}>Archived</h3>
          <div className="if-entity-grid">
            {archivedThemes.map((theme) => (
              <div key={theme.id} className="if-entity">
                <h3>{theme.name}</h3>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  disabled={busyId === theme.id}
                  onClick={() => void runAction(theme, "restore")}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Theme"
        actions={
          <>
            <Button variant="outlined" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-theme-form" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <form id="create-theme-form" onSubmit={handleCreate}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Select
              label="Preset"
              value={createPreset}
              onValueChange={setCreatePreset}
              options={PRESET_OPTIONS}
            />
            <Input
              label="Name (optional)"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder={`${PRESET_OPTIONS.find((o) => o.value === createPreset)?.label} theme`}
            />
          </Stack>
        </form>
      </Dialog>

      <Dialog
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Rename Theme"
        actions={
          <>
            <Button variant="outlined" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" form="rename-theme-form" disabled={renaming}>
              {renaming ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <form id="rename-theme-form" onSubmit={handleRename}>
          <Input
            label="Name"
            value={renameName}
            onChange={(event) => setRenameName(event.target.value)}
            required
          />
        </form>
      </Dialog>
    </div>
  );
}