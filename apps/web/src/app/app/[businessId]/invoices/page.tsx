"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiClient,
  type Invoice,
} from "@invoiceflow/api-client";
import {
  Alert,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function InvoicesPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) {
          setError("You must be signed in to view invoices.");
          setLoading(false);
        }
        return;
      }

      try {
        const page = await apiClient.listInvoices(
          businessId,
          session.access_token,
        );
        if (!cancelled) {
          setInvoices([...page.items]);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Failed to load invoices.",
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

  return (
    <main>
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Invoices
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && invoices.length === 0 && (
          <Typography variant="body1" color="text.secondary">
            No invoices yet.
          </Typography>
        )}

        {!loading && !error && invoices.length > 0 && (
          <Paper elevation={1}>
            <List>
              {invoices.map((invoice) => (
                <ListItem key={invoice.id} divider disablePadding>
                  <Link
                    href={`/app/${businessId}/invoices/${invoice.id}`}
                    style={{ textDecoration: "none", width: "100%" }}
                  >
                    <ListItemText
                      sx={{ px: 2, py: 1 }}
                      primary={invoice.number}
                      secondary={`${invoice.clientSnapshot.displayName} · ${invoice.status}`}
                    />
                  </Link>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </main>
  );
}
