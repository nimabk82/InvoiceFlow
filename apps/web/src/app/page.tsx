"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function route() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        router.replace("/auth/sign-in");
        return;
      }

      const token = session.access_token;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/businesses`,
        { headers: { authorization: `Bearer ${token}` } },
      );

      if (cancelled) return;

      if (!response.ok) {
        router.replace("/auth/sign-in");
        return;
      }

      const businesses = (await response.json()) as { id: string }[];

      if (businesses.length === 0) {
        router.replace("/onboarding/business");
      } else {
        router.replace(`/app/${businesses[0].id}`);
      }
    }

    void route();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: 2,
        }}
      >
        <Typography variant="h3" component="h1">
          InvoiceFlow
        </Typography>
        <CircularProgress />
      </Box>
    </main>
  );
}
