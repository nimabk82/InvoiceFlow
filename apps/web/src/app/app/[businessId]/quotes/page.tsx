"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiClient, type Quote } from "@invoiceflow/api-client";
import { Alert, Box, Card, CircularProgress, Typography } from "@mui/material";

import { Button, Input, StatusBadge, type StatusTone } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

const statusTone: Record<string, StatusTone> = {
  draft: "neutral",
  sent: "info",
  viewed: "info",
  accepted: "success",
  declined: "danger",
  expired: "neutral",
};

const TABS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
];

export default function QuotesPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [quotes, setQuotes] = useState<Quote[]>([]);
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
          setError("You must be signed in to view quotes.");
          setLoading(false);
        }
        return;
      }
      try {
        const page = await apiClient.listQuotes(
          businessId,
          session.access_token,
        );
        if (!cancelled) {
          setQuotes([...page.items]);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load quotes.",
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
    return quotes.filter((quote) => {
      const matchesTab = tab === "all" || quote.status === tab;
      const matchesSearch =
        query === "" ||
        quote.number.toLowerCase().includes(query) ||
        quote.clientSnapshot.displayName.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [quotes, tab, search]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <div>
      <div className="if-toolbar">
        <div className="if-search">
          <Input
            className="if-search-input"
            placeholder="Search quotes..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
          />
        </div>
        <Link href={`/app/${businessId}/quotes/new`} style={{ textDecoration: "none" }}>
          <Button>+ New Quote</Button>
        </Link>
      </div>

      <div className="if-tabs">
        {TABS.map((item) => (
          <button
            key={item.value}
            className={`if-tab ${tab === item.value ? "if-active" : ""}`}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No quotes match.
        </Typography>
      ) : (
        <>
          <Card className="if-table">
            <div className="if-table-head">
              <div>Number</div>
              <div>Client</div>
              <div>Issue</div>
              <div>Valid until</div>
              <div className="right" style={{ textAlign: "right" }}>Status</div>
            </div>
            {filtered.map((quote) => (
              <Link
                key={quote.id}
                href={`/app/${businessId}/quotes/${quote.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="if-table-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>{quote.number}</strong>
                  </div>
                  <div>
                    <strong>{quote.clientSnapshot.displayName}</strong>
                  </div>
                  <span>{quote.issueDate}</span>
                  <span>{quote.validUntil ?? "—"}</span>
                  <div className="right" style={{ textAlign: "right" }}>
                    <StatusBadge tone={statusTone[quote.status] ?? "neutral"}>
                      {quote.status}
                    </StatusBadge>
                  </div>
                </div>
              </Link>
            ))}
          </Card>

          <div className="if-mobile-list">
            {filtered.map((quote) => (
              <Link
                key={quote.id}
                href={`/app/${businessId}/quotes/${quote.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="if-mobile-card">
                  <div className="top">
                    <strong>{quote.number}</strong>
                    <StatusBadge tone={statusTone[quote.status] ?? "neutral"}>
                      {quote.status}
                    </StatusBadge>
                  </div>
                  <p>{quote.clientSnapshot.displayName}</p>
                  <div className="bottom" style={{ display: "flex", justifyContent: "space-between", marginTop: 13 }}>
                    <span style={{ fontSize: 11, color: "#667085" }}>{quote.issueDate}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}