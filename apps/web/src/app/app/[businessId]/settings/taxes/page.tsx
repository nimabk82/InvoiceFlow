"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiClient, type Tax } from "@invoiceflow/api-client";
import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import { Button, Dialog, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function TaxesPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const router = useRouter();

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
    <main>
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" component="h1">
            Taxes
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={openCreate}>
              <AddIcon sx={{ mr: 0.5 }} /> Add tax
            </Button>
          </Stack>
        </Stack>

        {loading && <Typography variant="body1">Loading…</Typography>}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && taxes.length === 0 && (
          <Typography variant="body1" color="text.secondary">
            No taxes yet.
          </Typography>
        )}

        {!loading && !error && taxes.length > 0 && (
          <Paper elevation={1}>
            <List>
              {taxes.map((tax) => (
                <ListItem
                  key={tax.id}
                  divider
                  secondaryAction={
                    <IconButton
                      aria-label="Edit tax"
                      onClick={() => openEdit(tax)}
                    >
                      <EditIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${tax.name} — ${tax.rate}%`}
                    secondary={
                      tax.isDefault
                        ? "Default"
                        : tax.registrationNumber ?? ""
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
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
      </Box>
    </main>
  );
}
