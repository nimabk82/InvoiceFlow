"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiClient, type Invoice } from "@invoiceflow/api-client";
import {
  Alert,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { Input, StatusBadge, type StatusTone } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

const statusTone: Record<string, StatusTone> = {
  draft: "neutral",
  sent: "info",
  viewed: "info",
  partially_paid: "warning",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

const TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "void", label: "Void" },
];

export default function InvoicesPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesTab = tab === "all" || invoice.status === tab;
      const matchesSearch =
        query === "" ||
        invoice.number.toLowerCase().includes(query) ||
        invoice.clientSnapshot.displayName.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [invoices, tab, search]);

  return (
    <main>
      <Box sx={{ maxWidth: 760, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Invoices
        </Typography>

        {!loading && !error && (
          <Stack spacing={2} sx={{ mb: 2 }}>
            <Input
              label="Search invoices"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {TABS.map((item) => (
                <Tab key={item.value} label={item.label} value={item.value} />
              ))}
            </Tabs>
          </Stack>
        )}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && filtered.length === 0 && (
          <Typography variant="body1" color="text.secondary">
            No invoices match.
          </Typography>
        )}

        {!loading && !error && filtered.length > 0 && (
          <Paper elevation={1}>
            <List>
              {filtered.map((invoice) => (
                <ListItem
                  key={invoice.id}
                  divider
                  disablePadding
                  secondaryAction={
                    <StatusBadge tone={statusTone[invoice.status] ?? "neutral"}>
                      {invoice.status}
                    </StatusBadge>
                  }
                >
                  <Link
                    href={`/app/${businessId}/invoices/${invoice.id}`}
                    style={{ textDecoration: "none", width: "100%" }}
                  >
                    <ListItemText
                      sx={{ px: 2, py: 1 }}
                      primary={invoice.number}
                      secondary={invoice.clientSnapshot.displayName}
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
