"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiClient, type Business } from "@invoiceflow/api-client";
import { Box, ListItemButton, ListItemText, Menu, MenuItem, Typography } from "@mui/material";

import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export function BusinessSwitcher({
  businessId,
}: {
  businessId: string;
}) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [current, setCurrent] = useState<Business | undefined>();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

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
          setCurrent(list.find((b) => b.id === businessId));
        }
      } catch {
        // ignore; the shell still renders with the URL businessId
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  function handleSwitch(nextId: string) {
    setAnchor(null);
    if (nextId === businessId) return;
    router.push(`/app/${nextId}`);
  }

  return (
    <>
      <ListItemButton
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ borderRadius: 1 }}
      >
        <ListItemText
          primary={current?.name ?? "Select business"}
          secondary="Switch"
        />
      </ListItemButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        {businesses.map((business) => (
          <MenuItem
            key={business.id}
            selected={business.id === businessId}
            onClick={() => handleSwitch(business.id)}
          >
            <Box>
              <Typography variant="body1">{business.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {business.countryCode} · {business.currencyCode}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export function CurrentBusiness({ businessId }: { businessId: string }) {
  const [current, setCurrent] = useState<Business | undefined>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      try {
        const list = await apiClient.listBusinesses(session.access_token);
        if (!cancelled) setCurrent(list.find((b) => b.id === businessId));
      } catch {
        // ignore
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return (
    <Typography variant="body2" color="text.secondary">
      {current?.name ?? ""}
    </Typography>
  );
}
