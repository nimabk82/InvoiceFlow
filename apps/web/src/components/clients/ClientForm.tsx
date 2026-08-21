"use client";

import { useState, type FormEvent } from "react";
import type { CreateClientInput } from "@invoiceflow/api-client";
import { Alert, Box, IconButton, Paper, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

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
  const [emails, setEmails] = useState<string[]>(
    initial?.emails && initial.emails.length > 0 ? [...initial.emails] : [""],
  );
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [taxNumber, setTaxNumber] = useState(initial?.taxNumber ?? "");

  function updateEmail(index: number, value: string) {
    setEmails((current) =>
      current.map((email, i) => (i === index ? value : email)),
    );
  }

  function addEmail() {
    setEmails((current) => [...current, ""]);
  }

  function removeEmail(index: number) {
    setEmails((current) => current.filter((_, i) => i !== index));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmails = emails.map((e) => e.trim()).filter(Boolean);
    onSubmit({
      name: name.trim() || undefined,
      company: company.trim() || undefined,
      emails: cleanEmails.length > 0 ? cleanEmails.map((address) => ({ address })) : undefined,
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

          <Box>
            <Stack spacing={1}>
              {emails.map((email, index) => (
                <Stack key={index} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                  <Input
                    label={index === 0 ? "Email" : `Email ${index + 1}`}
                    type="email"
                    value={email}
                    onChange={(event) => updateEmail(index, event.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                  {emails.length > 1 && (
                    <IconButton
                      aria-label="Remove email"
                      onClick={() => removeEmail(index)}
                      sx={{ mt: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>
            <Button variant="text" onClick={addEmail} sx={{ mt: 1 }}>
              <AddIcon sx={{ mr: 0.5 }} /> Add email
            </Button>
          </Box>

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
