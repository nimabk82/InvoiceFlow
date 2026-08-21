"use client";

import Link from "next/link";
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
  Typography,
} from "@mui/material";

import { Button } from "@/components/ui";
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
    <div>
      <div className="if-toolbar">
        <Link href={`/app/${businessId}/clients/new`} style={{ textDecoration: "none", marginLeft: "auto" }}>
          <Button>+ New Client</Button>
        </Link>
      </div>

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
        <div className="if-entity-grid">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/app/${businessId}/clients/${client.id}/edit`}
              style={{ textDecoration: "none" }}
            >
              <div className="if-entity">
                <h3>{client.name ?? client.company ?? "Unnamed client"}</h3>
                <p>{client.emails.map((e) => e.address).join(", ")}</p>
                {client.phone && <p>{client.phone}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
