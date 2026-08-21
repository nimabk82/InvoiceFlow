"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiClient, type Business } from "@invoiceflow/api-client";
import {
  Alert,
  Box,
  Button as MuiButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import { Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function ManageBusinessesPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const router = useRouter();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      try {
        const list = await apiClient.listBusinesses(session.access_token);
        if (!cancelled) {
          setBusinesses([...list]);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error ? caught.message : "Failed to load businesses.",
          );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <Box sx={{ maxWidth: 640, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Businesses
        </Typography>

        {loading && <Typography variant="body1">Loading…</Typography>}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <Paper elevation={1}>
            <List>
              {businesses.map((business) => {
                const isCurrent = business.id === businessId;
                return (
                  <ListItem
                    key={business.id}
                    divider
                    secondaryAction={
                      isCurrent ? (
                        <MuiButton size="small" variant="outlined" disabled>
                          Current
                        </MuiButton>
                      ) : (
                        <MuiButton
                          size="small"
                          variant="outlined"
                          onClick={() => router.push(`/app/${business.id}`)}
                        >
                          Switch
                        </MuiButton>
                      )
                    }
                  >
                    <ListItemText
                      primary={business.name}
                      secondary={`${business.countryCode} · ${business.currencyCode}`}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        )}

        <Box sx={{ mt: 2 }}>
          <Button onClick={() => router.push("/onboarding/business")}>
            + Add Business
          </Button>
        </Box>
      </Box>
    </main>
  );
}
