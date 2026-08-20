"use client";

import { useState, type FormEvent } from "react";
import type { CreateClientInput } from "@invoiceflow/api-client";
import { Alert, Paper, Stack } from "@mui/material";

import { Button, Input } from "@/components/ui";

export type ClientFormInitial = {
  name?: string;
  company?: string;
  emails?: readonly string[];
  phone?: string;
  taxNumber?: string;
};

type ClientFormProps = {
  initial?: ClientFormInitial;
  submitLabel: string;
  error: string | null;
  submitting: boolean;
  onSubmit: (input: CreateClientInput) => void;
};

export function ClientForm({
  initial,
  submitLabel,
  error,
  submitting,
  onSubmit,
}: ClientFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [email, setEmail] = useState(initial?.emails?.[0] ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [taxNumber, setTaxNumber] = useState(initial?.taxNumber ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      name: name.trim() || undefined,
      company: company.trim() || undefined,
      emails: email.trim() ? [{ address: email.trim() }] : undefined,
      phone: phone.trim() || undefined,
      taxNumber: taxNumber.trim() || undefined,
    });
  }

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <Input
            label="Tax number"
            value={taxNumber}
            onChange={(event) => setTaxNumber(event.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
