"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiClient, type Client, type Invoice } from "@invoiceflow/api-client";
import { Alert, Card, Typography } from "@mui/material";

import { Button, Toast, useToast } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function ClientDetailPage() {
  const params = useParams<{ businessId: string; clientId: string }>();
  const { businessId, clientId } = params;
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast, setToast } = useToast();

  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${businessId}:${clientId}`;
    if (startedRef.current === key) return;
    startedRef.current = key;
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
        const [found, page] = await Promise.all([
          apiClient.getClient(businessId, clientId, token),
          apiClient.listInvoices(businessId, token),
        ]);
        if (!cancelled) {
          setClient(found);
          setInvoices(page.items.filter((inv) => inv.clientId === clientId));
        }
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error ? caught.message : "Failed to load client.",
          );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [businessId, clientId]);

  async function handleToggleArchive() {
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setError("You must be signed in.");
      return;
    }
    try {
      if (client?.archivedAt) {
        const restored = await apiClient.restoreClient(businessId, clientId, token);
        setClient(restored);
        setToast("Client restored");
      } else {
        const archived = await apiClient.archiveClient(businessId, clientId, token);
        setClient(archived);
        setToast("Client archived");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    }
  }

  if (error && !client) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!client) {
    return <Typography variant="body1">Loading…</Typography>;
  }

  return (
    <div>
      <Card className="if-detail-hero" sx={{ mb: 3 }}>
        <div className="if-detail-title">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <h2>{client.company ?? client.name ?? "Unnamed client"}</h2>
            {client.archivedAt && (
              <Typography variant="caption" sx={{ color: "#667085" }}>
                Archived
              </Typography>
            )}
          </div>
          <p>{client.emails.map((e) => e.address).join(", ") || "No email"}</p>
        </div>
        <div className="if-actions">
          <Link href={`/app/${businessId}/clients/${clientId}/edit`} style={{ textDecoration: "none" }}>
            <Button variant="outlined">Edit</Button>
          </Link>
          <Button variant="outlined" onClick={handleToggleArchive}>
            {client.archivedAt ? "Restore" : "Archive"}
          </Button>
        </div>
      </Card>

      <Card sx={{ p: 2, mb: 3 }}>
        <div className="if-section-title">Invoices</div>
        {invoices.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No invoices for this client yet.
          </Typography>
        ) : (
          invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/app/${businessId}/invoices/${invoice.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "13px 0",
                  borderBottom: "1px solid #E4E7EC",
                }}
              >
                <strong style={{ fontSize: 13, color: "#101828" }}>{invoice.number}</strong>
                <span style={{ fontSize: 12, color: "#667085" }}>{invoice.status}</span>
              </div>
            </Link>
          ))
        )}
      </Card>

      {client.phone && (
        <Card sx={{ p: 2, mb: 3 }}>
          <div className="if-section-title">Contact</div>
          <Typography variant="body2">Phone: {client.phone}</Typography>
          {client.taxNumber && <Typography variant="body2">Tax #: {client.taxNumber}</Typography>}
        </Card>
      )}

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Toast key={toast ?? "none"} message={toast} />
    </div>
  );
}