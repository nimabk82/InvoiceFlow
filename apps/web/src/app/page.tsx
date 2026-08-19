import Link from "next/link";
import { Box, Stack, Typography } from "@mui/material";

import { Button } from "@/components/ui";

export default function HomePage() {
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
        <Stack spacing={3} sx={{ alignItems: "center" }}>
          <Typography variant="h3" component="h1">
            InvoiceFlow
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Invoicing, simplified.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Link href="/auth/sign-in">
              <Button>Sign in</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant="outlined">Sign up</Button>
            </Link>
            <Link href="/onboarding/business">
              <Button variant="outlined">Create business</Button>
            </Link>
          </Stack>
        </Stack>
      </Box>
    </main>
  );
}
