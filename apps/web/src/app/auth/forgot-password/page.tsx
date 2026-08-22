"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";

import { Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      },
    );

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
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
                Check your email
              </Typography>
              <Alert severity="success">
                If an account exists for {email}, a password reset link has
                been sent.
              </Alert>
              <Button variant="outlined" onClick={() => router.push("/auth/sign-in")}>
                Back to sign in
              </Button>
            </Stack>
          </Paper>
        </Box>
      </main>
    );
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
              Reset your password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your account email and we&apos;ll send you a reset link.
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
                {error && <Alert severity="error">{error}</Alert>}
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Sending…" : "Send reset link"}
                </Button>
              </Stack>
            </form>

            <Typography variant="body2">
              Remembered it? <Link href="/auth/sign-in">Sign in</Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </main>
  );
}