"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";

import { Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function handleRecovery() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          setError(
            "This reset link is invalid or expired. Request a new one.",
          );
        }
      }

      setRecovering(false);
    }

    void handleRecovery();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const { error: authError } = await supabase.auth.updateUser({
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
              Set a new password
            </Typography>

            {recovering ? (
              <Typography variant="body2" color="text.secondary">
                Verifying reset link…
              </Typography>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <Input
                    label="New password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <Input
                    label="Confirm password"
                    type="password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  {error && <Alert severity="error">{error}</Alert>}
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Updating…" : "Update password"}
                  </Button>
                </Stack>
              </form>
            )}
          </Stack>
        </Paper>
      </Box>
    </main>
  );
}