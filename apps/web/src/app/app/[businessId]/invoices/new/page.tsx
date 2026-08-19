"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ApiClient,
  type CreateInvoiceItemInput,
} from "@invoiceflow/api-client";
import {
  Alert,
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

type LineItem = CreateInvoiceItemInput;

function emptyItem(): LineItem {
  return { description: "", quantity: "1", rate: "" };
}

export default function NewInvoicePage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currencyCode, setCurrencyCode] = useState("CAD");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((current) => [...current, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be signed in to create an invoice.");
        setSubmitting(false);
        return;
      }

      await apiClient.createInvoice(
        businessId,
        {
          number,
          issueDate,
          dueDate: dueDate || undefined,
          currencyCode,
          items,
        },
        session.access_token,
      );

      router.push(`/app/${businessId}/invoices`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to create invoice.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          New Invoice
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Input
                  label="Invoice number"
                  value={number}
                  onChange={(event) => setNumber(event.target.value)}
                  placeholder="INV-001"
                />
                <Input
                  label="Issue date"
                  type="date"
                  value={issueDate}
                  onChange={(event) => setIssueDate(event.target.value)}
                  required
                />
                <Input
                  label="Due date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
                <Input
                  label="Currency"
                  value={currencyCode}
                  onChange={(event) => setCurrencyCode(event.target.value)}
                  required
                />
              </Stack>
            </Paper>

            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Line items
              </Typography>
              <Stack spacing={2}>
                {items.map((item, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
                  >
                    <Input
                      label="Description"
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, { description: event.target.value })
                      }
                      sx={{ flexGrow: 1 }}
                    />
                    <Input
                      label="Qty"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, { quantity: event.target.value })
                      }
                      sx={{ width: 90 }}
                    />
                    <Input
                      label="Rate"
                      value={item.rate}
                      onChange={(event) =>
                        updateItem(index, { rate: event.target.value })
                      }
                      sx={{ width: 120 }}
                    />
                    <IconButton
                      aria-label="Remove item"
                      onClick={() => removeItem(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button variant="outlined" onClick={addItem}>
                  Add item
                </Button>
              </Stack>
            </Paper>

            {error && <Alert severity="error">{error}</Alert>}

            <Box>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save draft"}
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </main>
  );
}
