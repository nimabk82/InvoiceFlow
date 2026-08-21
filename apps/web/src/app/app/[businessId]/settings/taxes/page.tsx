"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiClient, type Tax } from "@invoiceflow/api-client";
import {
  Alert,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { Button, Dialog, Input, StatusBadge } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function TaxesPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [isDefault, setIsDefault] = useState(false);
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
        const list = await apiClient.listTaxes(businessId, token);
        if (!cancelled) {
          setTaxes([...list]);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load taxes.",
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

  function openCreate() {
    setEditingId(null);
    setName("");
    setRate("");
    setRegistrationNumber("");
    setIsDefault(false);
    setDialogOpen(true);
  }

  function openEdit(tax: Tax) {
    setEditingId(tax.id);
    setName(tax.name);
    setRate(tax.rate);
    setRegistrationNumber(tax.registrationNumber ?? "");
    setIsDefault(tax.isDefault);
    setDialogOpen(true);
  }

  async function handleSave() {
    setError(null);
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

    const input = {
      name,
      rate,
      registrationNumber: registrationNumber || undefined,
      isDefault,
    };

    try {
      if (editingId) {
        const updated = await apiClient.updateTax(
          businessId,
          editingId,
          input,
          token,
        );
        setTaxes((current) =>
          current.map((t) => (t.id === editingId ? updated : t)),
        );
      } else {
        const created = await apiClient.createTax(businessId, input, token);
        setTaxes((current) => [...current, created]);
      }
      setDialogOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save tax.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Taxes</h2>
        <Button onClick={openCreate}>
          <AddIcon sx={{ mr: 0.5 }} /> Add tax
        </Button>
      </div>

      {loading && <Typography variant="body1">Loading…</Typography>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && taxes.length === 0 && (
        <Typography variant="body1" color="text.secondary">
          No taxes yet.
        </Typography>
      )}

      {!loading && !error && taxes.length > 0 && (
        <div>
          {taxes.map((tax) => (
            <div
              key={tax.id}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #E4E7EC" }}
            >
              <div>
                <strong style={{ fontSize: 14, color: "#101828" }}>{tax.name}</strong>
                <div className="small" style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                  {tax.rate}%{tax.registrationNumber ? ` · ${tax.registrationNumber}` : ""}
                </div>
              </div>
              {tax.isDefault ? (
                <StatusBadge tone="success">Default</StatusBadge>
              ) : (
                <Button variant="text" size="small" onClick={() => openEdit(tax)}>
                  Edit
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Edit Tax" : "Add Tax"}
        actions={
          <>
            <Button variant="outlined" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Input
            label="Rate (%)"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            required
          />
          <Input
            label="Registration number"
            value={registrationNumber}
            onChange={(event) => setRegistrationNumber(event.target.value)}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
              />
            }
            label="Default tax"
          />
        </Stack>
      </Dialog>
    </div>
  );
}
