"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";

import { Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/");
  }

  return (
    <main>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          px: 2,
        }}
      >
        <Paper elevation={2} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
          <Stack spacing={3}>
            <Typography variant="h5" component="h1">
              Sign in to InvoiceFlow
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                {error && <Alert severity="error">{error}</Alert>}
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>
              </Stack>
            </form>

            <Typography variant="body2">
              No account? <Link href="/auth/sign-up">Sign up</Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </main>
  );
}
