"use client";

import { useState, type FormEvent } from "react";
import type { CreateProductInput } from "@invoiceflow/api-client";
import { Alert, Paper, Stack } from "@mui/material";

import { Button, Input, Select } from "@/components/ui";

type ProductFormProps = {
  initial?: {
    type?: 'product' | 'service';
    name?: string;
    description?: string;
    defaultRate?: string;
    unit?: string;
  };
  submitLabel: string;
  error: string | null;
  submitting: boolean;
  onSubmit: (input: CreateProductInput) => void;
};

export function ProductForm({
  initial,
  submitLabel,
  error,
  submitting,
  onSubmit,
}: ProductFormProps) {
  const [type, setType] = useState<"product" | "service">(
    initial?.type ?? "product",
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [defaultRate, setDefaultRate] = useState(initial?.defaultRate ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      type,
      name: name.trim(),
      description: description.trim() || undefined,
      defaultRate: defaultRate.trim() || undefined,
      unit: unit.trim() || undefined,
    });
  }

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Select
            label="Type"
            value={type}
            onValueChange={(value) =>
              setType(value as "product" | "service")
            }
            options={[
              { value: "product", label: "Product" },
              { value: "service", label: "Service" },
            ]}
          />
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Input
            label="Default rate"
            value={defaultRate}
            onChange={(event) => setDefaultRate(event.target.value)}
          />
          <Input
            label="Unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
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
