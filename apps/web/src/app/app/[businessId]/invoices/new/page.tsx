"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ApiClient,
  type Client,
  type CreateInvoiceItemInput,
  type DepositDueRule,
} from "@invoiceflow/api-client";
import { calculateDocumentTotals } from "@invoiceflow/calculations";
import {
  Alert,
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { Button, Input, Select } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

type LineItem = CreateInvoiceItemInput;

function emptyItem(): LineItem {
  return {
    description: "",
    secondaryDescription: "",
    quantity: "1",
    rate: "",
    appliedTaxes: [],
  };
}

export default function NewInvoicePage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currencyCode, setCurrencyCode] = useState("CAD");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [depositType, setDepositType] = useState<
    "" | "percentage" | "fixed"
  >("");
  const [depositValue, setDepositValue] = useState("");
  const [depositDueRule, setDepositDueRule] =
    useState<DepositDueRule>("on_receipt");
  const [depositDueDate, setDepositDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function getToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = await getToken();
      if (!token) {
        if (!cancelled) setError("You must be signed in to create an invoice.");
        return;
      }
      try {
        const page = await apiClient.listClients(businessId, token);
        if (!cancelled) setClients([...page.items]);
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error
              ? caught.message
              : "Failed to load clients.",
          );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((current) => [...current, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  function addTax(itemIndex: number) {
    setItems((current) =>
      current.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              appliedTaxes: [
                ...(item.appliedTaxes ?? []),
                { name: "", rate: "" },
              ],
            }
          : item,
      ),
    );
  }

  function updateTax(
    itemIndex: number,
    taxIndex: number,
    patch: Partial<{ name: string; rate: string }>,
  ) {
    setItems((current) =>
      current.map((item, i) => {
        if (i !== itemIndex) return item;
        return {
          ...item,
          appliedTaxes: (item.appliedTaxes ?? []).map((tax, ti) =>
            ti === taxIndex ? { ...tax, ...patch } : tax,
          ),
        };
      }),
    );
  }

  function removeTax(itemIndex: number, taxIndex: number) {
    setItems((current) =>
      current.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              appliedTaxes: (item.appliedTaxes ?? []).filter(
                (_, ti) => ti !== taxIndex,
              ),
            }
          : item,
      ),
    );
  }

  async function handleAddClient() {
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("You must be signed in.");
      return;
    }

    try {
      const client = await apiClient.createClient(
        businessId,
        {
          name: newClientName || undefined,
          company: newClientCompany || undefined,
          emails: newClientEmail ? [{ address: newClientEmail }] : undefined,
        },
        token,
      );
      setClients((current) => [...current, client]);
      setClientId(client.id);
      setShowAddClient(false);
      setNewClientName("");
      setNewClientCompany("");
      setNewClientEmail("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to add client.",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const token = await getToken();
    if (!token) {
      setError("You must be signed in to create an invoice.");
      setSubmitting(false);
      return;
    }

    try {
      await apiClient.createInvoice(
        businessId,
        {
          number,
          clientId: clientId || undefined,
          issueDate,
          dueDate: dueDate || undefined,
          currencyCode,
          items,
          depositTerms: depositType
            ? {
                type: depositType,
                value: depositValue,
                dueRule: depositDueRule,
                dueDate:
                  depositDueRule === "custom" && depositDueDate
                    ? depositDueDate
                    : undefined,
              }
            : undefined,
        },
        token,
      );

      router.push(`/app/${businessId}/invoices`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to create invoice.",
      );
      setSubmitting(false);
    }
  }

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.name ?? client.company ?? "Unnamed client",
  }));

  const totals = useMemo(() => {
    try {
      return calculateDocumentTotals({
        currencyCode,
        items: items.map((item) => ({
          quantity: item.quantity || "0",
          rate: item.rate || "0",
          appliedTaxes: (item.appliedTaxes ?? []).filter(
            (tax) => tax.name.trim() !== "" || tax.rate.trim() !== "",
          ),
        })),
        depositTerms: depositType
          ? { type: depositType, value: depositValue }
          : undefined,
      });
    } catch {
      return null;
    }
  }, [items, currencyCode, depositType, depositValue]);

  return (
    <main>
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          New Invoice
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Select
                  label="Client"
                  value={clientId}
                  onValueChange={(value) => {
                    setClientId(value);
                    setShowAddClient(false);
                  }}
                  options={[
                    { value: "", label: "Select a client" },
                    ...clientOptions,
                  ]}
                />
                {!showAddClient && (
                  <Button variant="text" onClick={() => setShowAddClient(true)}>
                    Add new client
                  </Button>
                )}
                {showAddClient && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Input
                        label="Client name"
                        value={newClientName}
                        onChange={(event) =>
                          setNewClientName(event.target.value)
                        }
                      />
                      <Input
                        label="Company"
                        value={newClientCompany}
                        onChange={(event) =>
                          setNewClientCompany(event.target.value)
                        }
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={newClientEmail}
                        onChange={(event) =>
                          setNewClientEmail(event.target.value)
                        }
                      />
                      <Stack direction="row" spacing={1}>
                        <Button onClick={handleAddClient}>Add client</Button>
                        <Button
                          variant="outlined"
                          onClick={() => setShowAddClient(false)}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                )}
                <Input
                  label="Invoice number"
                  value={number}
                  onChange={(event) => setNumber(event.target.value)}
                  placeholder="INV-001"
                />
                <Input
                  label="Issue date"
                  type="date"
                  value={issueDate}
                  onChange={(event) => setIssueDate(event.target.value)}
                  required
                />
                <Input
                  label="Due date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
                <Input
                  label="Currency"
                  value={currencyCode}
                  onChange={(event) => setCurrencyCode(event.target.value)}
                  required
                />
              </Stack>
            </Paper>

            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Line items
              </Typography>
              <Stack spacing={2}>
                {items.map((item, index) => (
                  <Box key={index} sx={{ border: 1, borderColor: "divider", p: 2, borderRadius: 1 }}>
                    <Box
                      sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
                    >
                      <Stack spacing={1} sx={{ flexGrow: 1 }}>
                        <Input
                          label="Description"
                          value={item.description}
                          onChange={(event) =>
                            updateItem(index, {
                              description: event.target.value,
                            })
                          }
                        />
                        <Input
                          label="Secondary description"
                          value={item.secondaryDescription}
                          onChange={(event) =>
                            updateItem(index, {
                              secondaryDescription: event.target.value,
                            })
                          }
                        />
                      </Stack>
                      <Input
                        label="Qty"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, { quantity: event.target.value })
                        }
                        sx={{ width: 90 }}
                      />
                      <Input
                        label="Rate"
                        value={item.rate}
                        onChange={(event) =>
                          updateItem(index, { rate: event.target.value })
                        }
                        sx={{ width: 120 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 90, pt: 3 }}>
                        {totals?.lineTotals[index]?.toDecimalString() ?? "0.00"}
                      </Typography>
                      <IconButton
                        aria-label="Remove item"
                        onClick={() => removeItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Stack spacing={1} sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Taxes</Typography>
                      {(item.appliedTaxes ?? []).map((tax, taxIndex) => (
                        <Box
                          key={taxIndex}
                          sx={{ display: "flex", gap: 1 }}
                        >
                          <Input
                            label="Tax name"
                            value={tax.name}
                            onChange={(event) =>
                              updateTax(index, taxIndex, {
                                name: event.target.value,
                              })
                            }
                            sx={{ flexGrow: 1 }}
                          />
                          <Input
                            label="Rate %"
                            value={tax.rate}
                            onChange={(event) =>
                              updateTax(index, taxIndex, {
                                rate: event.target.value,
                              })
                            }
                            sx={{ width: 120 }}
                          />
                          <IconButton
                            aria-label="Remove tax"
                            onClick={() => removeTax(index, taxIndex)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        variant="text"
                        onClick={() => addTax(index)}
                      >
                        Add tax
                      </Button>
                    </Stack>
                  </Box>
                ))}
                <Button variant="outlined" onClick={addItem}>
                  Add item
                </Button>
                {totals && (
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body1">
                      Subtotal: {totals.subtotal.toDecimalString()}
                    </Typography>
                    <Typography variant="body1">
                      Tax: {totals.taxTotal.toDecimalString()}
                    </Typography>
                    <Typography variant="h6">
                      Total: {totals.total.toDecimalString()}
                    </Typography>
                    {totals.deposit && (
                      <>
                        <Typography variant="body1">
                          Deposit{" "}
                          {totals.deposit.type === "percentage"
                            ? `${totals.deposit.rate}%`
                            : ""}
                          : {totals.deposit.required.toDecimalString()}
                        </Typography>
                        <Typography variant="body1">
                          Remaining: {totals.deposit.remaining.toDecimalString()}
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Stack>
            </Paper>

            <Paper elevation={1} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" gutterBottom>
                  Deposit
                </Typography>
                <Select
                  label="Deposit type"
                  value={depositType}
                  onValueChange={(value) => setDepositType(value as "" | "percentage" | "fixed")}
                  options={[
                    { value: "", label: "No deposit" },
                    { value: "percentage", label: "Percentage" },
                    { value: "fixed", label: "Fixed amount" },
                  ]}
                />
                {depositType !== "" && (
                  <>
                    <Input
                      label={depositType === "percentage" ? "Deposit %" : "Deposit amount"}
                      value={depositValue}
                      onChange={(event) => setDepositValue(event.target.value)}
                    />
                    <Select
                      label="Deposit due"
                      value={depositDueRule}
                      onValueChange={(value) => setDepositDueRule(value as DepositDueRule)}
                      options={[
                        { value: "on_receipt", label: "On receipt" },
                        { value: "days_7", label: "Within 7 days" },
                        { value: "days_15", label: "Within 15 days" },
                        { value: "custom", label: "Custom date" },
                      ]}
                    />
                    {depositDueRule === "custom" && (
                      <Input
                        label="Deposit due date"
                        type="date"
                        value={depositDueDate}
                        onChange={(event) => setDepositDueDate(event.target.value)}
                      />
                    )}
                  </>
                )}
              </Stack>
            </Paper>

            {error && <Alert severity="error">{error}</Alert>}

            <Box>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save draft"}
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </main>
  );
}
