"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiClient, type Business } from "@invoiceflow/api-client";
import {
  Alert,
  Box,
  Button as MuiButton,
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
    <div>
      <h2>Manage Businesses</h2>

      {loading && <Typography variant="body1">Loading…</Typography>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <div>
          {businesses.map((business) => {
            const isCurrent = business.id === businessId;
            return (
              <div
                key={business.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #E4E7EC" }}
              >
                <div>
                  <strong style={{ fontSize: 14, color: "#101828" }}>{business.name}</strong>
                  <div className="small" style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                    {business.countryCode} · {business.currencyCode}
                  </div>
                </div>
                {isCurrent ? (
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
                )}
              </div>
            );
          })}
        </div>
      )}

      <Box sx={{ mt: 2 }}>
        <Button onClick={() => router.push("/onboarding/business")}>
          + Add Business
        </Button>
      </Box>
    </div>
  );
}
