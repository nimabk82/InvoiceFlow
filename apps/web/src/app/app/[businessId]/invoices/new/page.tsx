"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ApiClient,
  type Client,
  type CreateInvoiceItemInput,
  type DepositDueRule,
  type ProductService,
} from "@invoiceflow/api-client";
import { calculateDocumentTotals } from "@invoiceflow/calculations";
import { validateDocumentForReview } from "@invoiceflow/validation";
import { Alert, Box, Card, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { Button, Input, Select } from "@/components/ui";
import { ProductLibraryDialog } from "@/components/products/ProductLibraryDialog";
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
  const [products, setProducts] = useState<ProductService[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [clientId, setClientId] = useState("");
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
  const [poNumber, setPoNumber] = useState("");
  const [discountType, setDiscountType] = useState<
    "" | "percentage" | "fixed"
  >("");
  const [discountValue, setDiscountValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reviewIssues, setReviewIssues] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function buildInvoiceInput(): Parameters<typeof apiClient.createInvoice>[1] {
    return {
      number,
      clientId: clientId || undefined,
      issueDate,
      dueDate: dueDate || undefined,
      currencyCode,
      poNumber: poNumber || undefined,
      items,
      discount: discountType
        ? { type: discountType, value: discountValue }
        : undefined,
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
    };
  }

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
        const productPage = await apiClient.listProducts(businessId, token);
        if (!cancelled) setProducts([...productPage.items]);
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

  function addFromLibrary(product: ProductService) {
    setItems((current) => [
      ...current,
      {
        description: product.name,
        secondaryDescription: product.description ?? "",
        quantity: "1",
        rate: product.defaultRate ?? "",
        appliedTaxes: [],
        sourceProductServiceId: product.id,
      },
    ]);
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

  async function saveDraft(token: string) {
    return apiClient.createInvoice(businessId, buildInvoiceInput(), token);
  }

  function focusFirstIssue(issues: readonly { path?: string }[]) {
    const first = issues.find((issue) => issue.path);
    if (!first?.path) return;
    const id = first.path === "client" ? "client-select" : first.path;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById(id)?.focus?.();
  }

  async function handleReview() {
    setError(null);
    const result = validateDocumentForReview({
      clientSelected: clientId !== "",
      items: items.map((item) => ({ rate: item.rate })),
    });

    if (!result.valid) {
      setReviewIssues(result.issues.map((issue) => issue.message));
      focusFirstIssue(result.issues);
      return;
    }

    setReviewIssues([]);
    setSubmitting(true);

    const token = await getToken();
    if (!token) {
      setError("You must be signed in to create an invoice.");
      setSubmitting(false);
      return;
    }

    try {
      const invoice = await saveDraft(token);
      router.push(`/app/${businessId}/invoices/${invoice.id}/review`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to create invoice.",
      );
      setSubmitting(false);
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
      await saveDraft(token);

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
        discount: discountType
          ? { type: discountType, value: discountValue }
          : undefined,
      });
    } catch {
      return null;
    }
  }, [items, currencyCode, depositType, depositValue, discountType, discountValue]);

  const selectedClient = clients.find((client) => client.id === clientId);

  return (
    <form onSubmit={handleSubmit}>
      {/* Client selector */}
      <Card sx={{ p: 2, mb: 3 }}>
        <div className="if-eyebrow">Bill to</div>
        {selectedClient ? (
          <div className="if-client-selector">
            <div className="if-selector-main">
              <div className="if-avatar">
                {(selectedClient.name ?? selectedClient.company ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>{selectedClient.name ?? selectedClient.company ?? "Unnamed client"}</strong>
                <span>{selectedClient.emails[0]?.address ?? "No email"}</span>
              </div>
            </div>
            <Button variant="outlined" onClick={() => setClientId("")}>
              Change
            </Button>
          </div>
        ) : (
          <Select
            id="client-select"
            label="Select a client"
            value=""
            onValueChange={(value) => setClientId(value)}
            options={clientOptions}
          />
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2 }}>
          <Input label="Invoice #" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="INV-001" />
          <Input label="Currency" value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)} />
          <Input label="Issue date" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required />
          <Input label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </Box>
      </Card>

      <div className="if-editor-bottom">
        {/* Line items */}
        <div>
          <Card sx={{ overflow: "hidden" }}>
            <div className="if-row-grid if-row-head" style={{ gridTemplateColumns: "minmax(200px,1fr) 90px 120px 110px 40px" }}>
              <div>Description</div>
              <div>Qty</div>
              <div>Rate</div>
              <div className="if-right">Amount</div>
              <div />
            </div>
            {items.map((item, index) => (
              <div
                key={index}
                className="if-row-grid if-row"
                style={{ gridTemplateColumns: "minmax(200px,1fr) 90px 120px 110px 40px" }}
              >
                <div>
                  <Input
                    label="Description"
                    value={item.description}
                    onChange={(event) => updateItem(index, { description: event.target.value })}
                    size="small"
                  />
                  <Input
                    label="Details"
                    value={item.secondaryDescription}
                    onChange={(event) => updateItem(index, { secondaryDescription: event.target.value })}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                  {(item.appliedTaxes ?? []).map((tax, taxIndex) => (
                    <Box key={taxIndex} sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Input
                        size="small"
                        label="Tax name"
                        value={tax.name}
                        onChange={(event) => updateTax(index, taxIndex, { name: event.target.value })}
                      />
                      <Input
                        size="small"
                        label="%"
                        value={tax.rate}
                        onChange={(event) => updateTax(index, taxIndex, { rate: event.target.value })}
                        sx={{ width: 80 }}
                      />
                      <IconButton aria-label="Remove tax" onClick={() => removeTax(index, taxIndex)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button variant="text" size="small" onClick={() => addTax(index)}>
                    + Tax
                  </Button>
                </div>
                <Input
                  size="small"
                  label="Qty"
                  value={item.quantity}
                  onChange={(event) => updateItem(index, { quantity: event.target.value })}
                />
                <Input
                  size="small"
                  id={`items[${index}].rate`}
                  label="Rate"
                  value={item.rate}
                  onChange={(event) => updateItem(index, { rate: event.target.value })}
                />
                <div className="if-right if-amount money">
                  {totals?.lineTotals[index]?.toDecimalString() ?? "0.00"}
                </div>
                <IconButton aria-label="Remove item" onClick={() => removeItem(index)}>
                  <DeleteIcon />
                </IconButton>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #E4E7EC", padding: "11px 16px", background: "#FCFCFD" }}>
              <button type="button" onClick={addItem} className="if-text-action">+ Add line item</button>
              <button type="button" onClick={() => setLibraryOpen(true)} className="if-text-action" style={{ marginLeft: 18 }}>
                + From library
              </button>
            </div>
          </Card>

          <ProductLibraryDialog
            open={libraryOpen}
            products={products}
            onClose={() => setLibraryOpen(false)}
            onSelect={addFromLibrary}
          />

          {/* Deposit + More options */}
          <Card sx={{ p: 3, mt: 3 }}>
            <div className="if-eyebrow">Deposit</div>
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
                  sx={{ mt: 2 }}
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
          </Card>

          <Card sx={{ p: 3, mt: 3 }}>
            <div className="if-eyebrow">More options</div>
            <Input label="PO #" value={poNumber} onChange={(event) => setPoNumber(event.target.value)} />
            <Select
              label="Discount type"
              value={discountType}
              onValueChange={(value) => setDiscountType(value as "" | "percentage" | "fixed")}
              options={[
                { value: "", label: "No discount" },
                { value: "percentage", label: "Percentage" },
                { value: "fixed", label: "Fixed amount" },
              ]}
            />
            {discountType !== "" && (
              <Input
                label={discountType === "percentage" ? "Discount %" : "Discount amount"}
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
              />
            )}
          </Card>
        </div>

        {/* Sticky summary */}
        <Card className="if-summary" sx={{ p: 2 }}>
          <div className="if-section-title">Summary</div>
          {totals ? (
            <>
              <SumRow label="Subtotal" value={totals.subtotal.toDecimalString()} />
              {totals.discountAmount && !totals.discountAmount.isZero && (
                <SumRow label="Discount" value={`-${totals.discountAmount.toDecimalString()}`} />
              )}
              <SumRow label="Tax" value={totals.taxTotal.toDecimalString()} />
              <div className="if-sumrow if-total money">
                <span>Total</span>
                <strong>{totals.total.toDecimalString()}</strong>
              </div>
              {totals.deposit && (
                <div className="if-depositbox">
                  <div className="if-dtop">
                    <span className="if-label">Deposit due</span>
                    <span className="if-amt money">{totals.deposit.required.toDecimalString()}</span>
                  </div>
                  <div className="if-dtop" style={{ marginTop: 4 }}>
                    <span className="if-label">Remaining</span>
                    <span className="if-amt money" style={{ fontSize: 15 }}>{totals.deposit.remaining.toDecimalString()}</span>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </Card>
      </div>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {reviewIssues.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Review blocked</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            {reviewIssues.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Sticky editor bar */}
      <div className="if-sticky-editor">
        <div className="if-sticky-inner">
          <span className="if-saved">Saved ✓</span>
          <Button
            type="button"
            onClick={handleReview}
            disabled={submitting}
            sx={{ height: 44, padding: "0 24px" }}
          >
            {submitting ? "Saving…" : "Review Invoice →"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="if-sumrow money">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
