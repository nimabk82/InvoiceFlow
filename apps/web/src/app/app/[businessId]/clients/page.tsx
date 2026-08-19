"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ApiClient,
  type Client,
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

export default function ClientsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [clients, setClients] = useState<Client[]>([]);
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
          setError("You must be signed in to view clients.");
          setLoading(false);
        }
        return;
      }

      try {
        const page = await apiClient.listClients(
          businessId,
          session.access_token,
        );
        if (!cancelled) {
          setClients([...page.items]);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Failed to load clients.",
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
          Clients
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && clients.length === 0 && (
          <Typography variant="body1" color="text.secondary">
            No clients yet.
          </Typography>
        )}

        {!loading && !error && clients.length > 0 && (
          <Paper elevation={1}>
            <List>
              {clients.map((client) => (
                <ListItem key={client.id} divider>
                  <ListItemText
                    primary={client.name ?? client.company ?? "Unnamed client"}
                    secondary={client.emails[0]?.address}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </main>
  );
}
