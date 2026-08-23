"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ApiClient,
  type Client,
  type CreateInvoiceItemInput,
  type DepositDueRule,
  type ProductService,
  type Tax,
} from "@invoiceflow/api-client";
import { calculateDocumentTotals } from "@invoiceflow/calculations";
import { validateDocumentForReview } from "@invoiceflow/validation";
import { Alert, Card, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { Button, Dialog, Input, Select } from "@/components/ui";
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
  const draftId = useSearchParams().get("draftId");
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<ProductService[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemDetails, setNewItemDetails] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemRate, setNewItemRate] = useState("");
  const [newItemTaxIds, setNewItemTaxIds] = useState<string[]>([]);
  const [editingTaxSnapshots, setEditingTaxSnapshots] = useState<
    Record<string, { name: string; rate: string }>
  >({});
  const [newTaxOpen, setNewTaxOpen] = useState(false);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("");
  const [savingNewTax, setSavingNewTax] = useState(false);
  const [itemDialogError, setItemDialogError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currencyCode, setCurrencyCode] = useState("CAD");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [depositType, setDepositType] = useState<"" | "percentage" | "fixed">(
    ""
  );
  const [depositValue, setDepositValue] = useState("");
  const [depositDueRule, setDepositDueRule] =
    useState<DepositDueRule>("on_receipt");
  const [depositDueDate, setDepositDueDate] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [depositEditorOpen, setDepositEditorOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"" | "percentage" | "fixed">(
    ""
  );
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
      notes: notes.trim() ? textToRichText(notes) : undefined,
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
        const [page, productPage, taxList, draft] = await Promise.all([
          apiClient.listClients(businessId, token),
          apiClient.listProducts(businessId, token),
          apiClient.listTaxes(businessId, token),
          draftId
            ? apiClient.getInvoice(businessId, draftId, token)
            : Promise.resolve(null),
        ]);
        if (!cancelled) {
          setClients([...page.items]);
          setProducts([...productPage.items]);
          setTaxes([...taxList]);
          if (draft) {
            if (draft.status !== "draft") {
              setError("Only draft invoices can be edited.");
              return;
            }
            setClientId(draft.clientId ?? "");
            setNumber(draft.number);
            setIssueDate(draft.issueDate);
            setDueDate(draft.dueDate ?? "");
            setCurrencyCode(draft.currencyCode);
            setPoNumber(draft.poNumber ?? "");
            setNotes(richTextToText(draft.notes));
            setItems(
              draft.items.map((item) => ({
                ...item,
                appliedTaxes: [...item.appliedTaxes],
              }))
            );
            setDiscountType(draft.discount?.type ?? "");
            setDiscountValue(draft.discount?.value ?? "");
            setDepositType(draft.depositTerms?.type ?? "");
            setDepositValue(draft.depositTerms?.value ?? "");
            setDepositDueRule(draft.depositTerms?.dueRule ?? "on_receipt");
            setDepositDueDate(draft.depositTerms?.dueDate ?? "");
          }
        }
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error ? caught.message : "Failed to load clients."
          );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId, draftId]);

  function openItemDialog(index?: number) {
    const item = typeof index === "number" ? items[index] : undefined;
    setEditingItemIndex(typeof index === "number" ? index : null);
    setNewItemDescription(item?.description ?? "");
    setNewItemDetails(item?.secondaryDescription ?? "");
    setNewItemQuantity(item?.quantity ?? "1");
    setNewItemRate(item?.rate ?? "");

    if (item) {
      const snapshots: Record<string, { name: string; rate: string }> = {};
      const taxIds = (item.appliedTaxes ?? []).map((appliedTax, taxIndex) => {
        const existing = taxes.find(
          (tax) =>
            tax.name === appliedTax.name && tax.rate === appliedTax.rate
        );
        if (existing) return existing.id;
        const snapshotId = `snapshot-${taxIndex}`;
        snapshots[snapshotId] = appliedTax;
        return snapshotId;
      });
      setEditingTaxSnapshots(snapshots);
      setNewItemTaxIds(taxIds);
    } else {
      const defaultTaxId = taxes.find((tax) => tax.isDefault)?.id;
      setEditingTaxSnapshots({});
      setNewItemTaxIds(defaultTaxId ? [defaultTaxId] : []);
    }

    setNewTaxOpen(false);
    setNewTaxName("");
    setNewTaxRate("");
    setItemDialogError(null);
    setItemDialogOpen(true);
  }

  function saveItemFromDialog() {
    const description = newItemDescription.trim();
    const quantity = Number(newItemQuantity);
    const rate = Number(newItemRate);
    if (!description) {
      setItemDialogError("Enter an item name.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setItemDialogError("Enter a quantity greater than zero.");
      return;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      setItemDialogError("Enter a valid rate.");
      return;
    }

    const selectedTaxes = newItemTaxIds
      .map(
        (taxId) =>
          taxes.find((tax) => tax.id === taxId) ??
          editingTaxSnapshots[taxId]
      )
      .filter(
        (tax): tax is Tax | { name: string; rate: string } => Boolean(tax)
      );
    const existingItem =
      editingItemIndex === null ? undefined : items[editingItemIndex];
    const item: LineItem = {
      description,
      secondaryDescription: newItemDetails.trim(),
      quantity: newItemQuantity,
      rate: newItemRate,
      sourceProductServiceId: existingItem?.sourceProductServiceId,
      appliedTaxes: selectedTaxes.map((tax) => ({
        name: tax.name,
        rate: tax.rate,
      })),
    };
    setItems((current) => {
      if (editingItemIndex !== null) {
        return current.map((currentItem, index) =>
          index === editingItemIndex ? item : currentItem
        );
      }
      return current.length === 1 && isEmptyItem(current[0])
        ? [item]
        : [...current, item];
    });
    setItemDialogOpen(false);
  }

  function addDialogTax() {
    const available = taxes.find((tax) => !newItemTaxIds.includes(tax.id));
    if (available) setNewItemTaxIds((current) => [...current, available.id]);
  }

  function updateDialogTax(index: number, taxId: string) {
    setNewItemTaxIds((current) =>
      current.map((currentTaxId, currentIndex) =>
        currentIndex === index ? taxId : currentTaxId
      )
    );
  }

  function removeDialogTax(index: number) {
    setNewItemTaxIds((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  async function createDialogTax() {
    const name = newTaxName.trim();
    const rate = Number(newTaxRate);
    if (!name) {
      setItemDialogError("Enter a tax name.");
      return;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      setItemDialogError("Enter a valid tax rate.");
      return;
    }

    setSavingNewTax(true);
    setItemDialogError(null);
    const token = await getToken();
    if (!token) {
      setItemDialogError("You must be signed in to create a tax.");
      setSavingNewTax(false);
      return;
    }

    try {
      const created = await apiClient.createTax(
        businessId,
        { name, rate: newTaxRate },
        token
      );
      setTaxes((current) => [...current, created]);
      setNewItemTaxIds((current) => [...current, created.id]);
      setNewTaxName("");
      setNewTaxRate("");
      setNewTaxOpen(false);
    } catch (caught) {
      setItemDialogError(
        caught instanceof Error ? caught.message : "Failed to create tax."
      );
    } finally {
      setSavingNewTax(false);
    }
  }

  function addFromLibrary(product: ProductService) {
    const libraryItem: LineItem = {
      description: product.name,
      secondaryDescription: product.description ?? "",
      quantity: "1",
      rate: product.defaultRate ?? "",
      appliedTaxes: [],
      sourceProductServiceId: product.id,
    };
    setItems((current) =>
      current.length === 1 && isEmptyItem(current[0])
        ? [libraryItem]
        : [...current, libraryItem]
    );
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  async function saveDraft(token: string) {
    return draftId
      ? apiClient.updateInvoice(businessId, draftId, buildInvoiceInput(), token)
      : apiClient.createInvoice(businessId, buildInvoiceInput(), token);
  }

  function focusFirstIssue(issues: readonly { path?: string }[]) {
    const first = issues.find((issue) => issue.path);
    if (!first?.path) return;
    const id = first.path === "client" ? "client-select" : first.path;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
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
      const reviewRoute = `/app/${businessId}/invoices/${invoice.id}/review`;
      if (draftId) router.push(reviewRoute);
      else router.replace(reviewRoute);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save invoice."
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
        caught instanceof Error ? caught.message : "Failed to save invoice."
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
            (tax) => tax.name.trim() !== "" || tax.rate.trim() !== ""
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
  }, [
    items,
    currencyCode,
    depositType,
    depositValue,
    discountType,
    discountValue,
  ]);

  const selectedClient = clients.find((client) => client.id === clientId);

  return (
    <form onSubmit={handleSubmit} className="if-invoice-editor">
      <section className="if-editor-section">
        <div className="if-eyebrow">Client</div>
        {selectedClient ? (
          <div className="if-client-selector">
            <div className="if-selector-main">
              <div className="if-avatar">
                {(selectedClient.name ?? selectedClient.company ?? "?")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <strong>
                  {selectedClient.name ??
                    selectedClient.company ??
                    "Unnamed client"}
                </strong>
                <span>{selectedClient.emails[0]?.address ?? "No email"}</span>
              </div>
            </div>
            <button
              type="button"
              className="if-selector-change"
              onClick={() => setClientId("")}
              aria-label="Change client"
            >
              ›
            </button>
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
      </section>

      <section className="if-editor-section">
        <div className="if-eyebrow">Invoice details</div>
        <div className="if-invoice-details">
          <Input
            label="Invoice #"
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
        </div>
      </section>

      <section className="if-editor-section">
        <div className="if-eyebrow">Items</div>
        <Card className="if-invoice-items" sx={{ overflow: "hidden" }}>
          <div className="if-row-grid if-row-head if-invoice-item-grid">
            <div>Item name</div>
            <div>Qty</div>
            <div>Rate</div>
            <div className="if-right">Amount</div>
            <div />
          </div>
          {items.map((item, index) => (
            <div
              key={index}
              className="if-row-grid if-row if-invoice-item-grid"
              role="button"
              tabIndex={0}
              aria-label={`Edit ${item.description || `item ${index + 1}`}`}
              onClick={() => openItemDialog(index)}
              onKeyDown={(event) => {
                if (
                  event.currentTarget === event.target &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  openItemDialog(index);
                }
              }}
            >
              <div className="if-item-description">
                <strong className="if-item-name-text">
                  {item.description || "Unnamed item"}
                </strong>
                {item.secondaryDescription ? (
                  <div className="if-item-detail-text">
                    {item.secondaryDescription}
                  </div>
                ) : null}
                {(item.appliedTaxes ?? []).length > 0 ? (
                  <div className="if-item-tax-text">
                    {(item.appliedTaxes ?? [])
                      .map((tax) => `${tax.name} ${tax.rate}%`)
                      .join(" · ")}
                  </div>
                ) : null}
              </div>
              <span className="if-item-cell-value">{item.quantity}</span>
              <span className="if-item-cell-value">{item.rate}</span>
              <div className="if-right if-amount money" data-label="Amount">
                {formatMoney(
                  totals?.lineTotals[index]?.toDecimalString() ?? "0",
                  currencyCode
                )}
              </div>
              <IconButton
                className="if-item-remove"
                aria-label="Remove item"
                onClick={(event) => {
                  event.stopPropagation();
                  removeItem(index);
                }}
              >
                <CloseIcon />
              </IconButton>
            </div>
          ))}
          <div className="if-item-addbar">
            <button
              type="button"
              onClick={() => openItemDialog()}
              className="if-text-action"
            >
              + Add item
            </button>
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="if-item-library-action"
            >
              From library
            </button>
          </div>
        </Card>
      </section>

      <Dialog
        className="if-add-item-dialog"
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        title={
          <div className="if-add-item-dialog-title">
            <span>
              {editingItemIndex === null
                ? "Add invoice item"
                : "Edit invoice item"}
            </span>
            <IconButton
              aria-label="Close add item dialog"
              onClick={() => setItemDialogOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </div>
        }
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => setItemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveItemFromDialog}>
              {editingItemIndex === null ? "Add Item" : "Save Item"}
            </Button>
          </>
        }
      >
        <div className="if-add-item-form">
          <div className="if-dialog-field if-dialog-field-wide">
            <label htmlFor="new-item-description">Item name</label>
            <Input
              id="new-item-description"
              autoFocus
              value={newItemDescription}
              onChange={(event) => setNewItemDescription(event.target.value)}
              placeholder="Consulting"
            />
          </div>
          <div className="if-dialog-field if-dialog-field-wide">
            <label htmlFor="new-item-details">Details</label>
            <Input
              id="new-item-details"
              value={newItemDetails}
              onChange={(event) => setNewItemDetails(event.target.value)}
              placeholder="Optional details"
            />
          </div>
          <div className="if-dialog-field">
            <label htmlFor="new-item-quantity">Quantity</label>
            <Input
              id="new-item-quantity"
              type="number"
              slotProps={{ htmlInput: { step: "any", min: 0 } }}
              value={newItemQuantity}
              onChange={(event) => setNewItemQuantity(event.target.value)}
            />
          </div>
          <div className="if-dialog-field">
            <label htmlFor="new-item-rate">Rate</label>
            <Input
              id="new-item-rate"
              type="number"
              slotProps={{ htmlInput: { step: "any", min: 0 } }}
              value={newItemRate}
              onChange={(event) => setNewItemRate(event.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="if-dialog-field if-dialog-field-wide">
            <label>Taxes</label>
            <div className="if-dialog-tax-list">
              {newItemTaxIds.length === 0 ? (
                <div className="if-dialog-no-tax">No taxes applied</div>
              ) : null}
              {newItemTaxIds.map((taxId, taxIndex) => (
                <div className="if-dialog-tax-row" key={`${taxIndex}-${taxId}`}>
                  <select
                    className="if-dialog-select"
                    aria-label={`Tax ${taxIndex + 1}`}
                    value={taxId}
                    onChange={(event) =>
                      updateDialogTax(taxIndex, event.target.value)
                    }
                  >
                    {editingTaxSnapshots[taxId] ? (
                      <option value={taxId}>
                        {editingTaxSnapshots[taxId].name}{" "}
                        {editingTaxSnapshots[taxId].rate}% (historical)
                      </option>
                    ) : null}
                    {taxes.map((tax) => (
                      <option
                        key={tax.id}
                        value={tax.id}
                        disabled={
                          tax.id !== taxId && newItemTaxIds.includes(tax.id)
                        }
                      >
                        {tax.name} {tax.rate}%
                      </option>
                    ))}
                  </select>
                  <IconButton
                    aria-label={`Remove tax ${taxIndex + 1}`}
                    onClick={() => removeDialogTax(taxIndex)}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
              ))}
              <div className="if-dialog-tax-actions">
                {taxes.some((tax) => !newItemTaxIds.includes(tax.id)) ? (
                  <button
                    type="button"
                    className="if-dialog-add-tax"
                    onClick={addDialogTax}
                  >
                    + Add existing tax
                  </button>
                ) : null}
                <button
                  type="button"
                  className="if-dialog-add-tax"
                  onClick={() => setNewTaxOpen((open) => !open)}
                >
                  + Add new tax
                </button>
              </div>
              {newTaxOpen ? (
                <div className="if-dialog-new-tax">
                  <div className="if-dialog-field">
                    <label htmlFor="new-tax-name">Tax name</label>
                    <Input
                      id="new-tax-name"
                      value={newTaxName}
                      onChange={(event) => setNewTaxName(event.target.value)}
                      placeholder="HST"
                    />
                  </div>
                  <div className="if-dialog-field">
                    <label htmlFor="new-tax-rate">Rate</label>
                    <Input
                      id="new-tax-rate"
                      type="number"
                      slotProps={{ htmlInput: { step: "any", min: 0 } }}
                      value={newTaxRate}
                      onChange={(event) => setNewTaxRate(event.target.value)}
                      placeholder="13"
                    />
                  </div>
                  <Button
                    variant="outlined"
                    onClick={() => void createDialogTax()}
                    disabled={savingNewTax}
                  >
                    {savingNewTax ? "Adding…" : "Create tax"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          {itemDialogError ? (
            <Alert severity="error" className="if-dialog-field-wide">
              {itemDialogError}
            </Alert>
          ) : null}
        </div>
      </Dialog>

      <div className="if-editor-bottom">
        <div className="if-editor-notes-column">
          <ProductLibraryDialog
            open={libraryOpen}
            products={products}
            onClose={() => setLibraryOpen(false)}
            onSelect={addFromLibrary}
          />

          <div className="if-eyebrow">Notes</div>
          <Input
            multiline
            minRows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Thank you for your business."
            aria-label="Invoice notes"
          />

          <button
            type="button"
            className="if-more-options-toggle"
            onClick={() => setMoreOptionsOpen((open) => !open)}
            aria-expanded={moreOptionsOpen}
          >
            <span>More options</span>
            <span>{moreOptionsOpen ? "−" : "+"}</span>
          </button>

          {moreOptionsOpen && (
            <Card className="if-more-options-panel">
              <div className="if-options-grid">
                <Input
                  label="PO #"
                  value={poNumber}
                  onChange={(event) => setPoNumber(event.target.value)}
                  placeholder="Optional"
                />
                <Input
                  label="Currency"
                  value={currencyCode}
                  onChange={(event) => setCurrencyCode(event.target.value)}
                />
              </div>
              <div className="if-options-grid if-options-grid-secondary">
                <Select
                  label="Discount type"
                  value={discountType}
                  onValueChange={(value) =>
                    setDiscountType(value as "" | "percentage" | "fixed")
                  }
                  options={[
                    { value: "", label: "No discount" },
                    { value: "percentage", label: "Percentage" },
                    { value: "fixed", label: "Fixed amount" },
                  ]}
                />
                {discountType !== "" && (
                  <Input
                    label={
                      discountType === "percentage"
                        ? "Discount %"
                        : "Discount amount"
                    }
                    value={discountValue}
                    onChange={(event) => setDiscountValue(event.target.value)}
                  />
                )}
              </div>
            </Card>
          )}
        </div>

        <Card className="if-summary" sx={{ p: 2.25 }}>
          {totals ? (
            <>
              <SumRow
                label="Subtotal"
                value={formatMoney(
                  totals.subtotal.toDecimalString(),
                  currencyCode
                )}
              />
              {totals.discountAmount && !totals.discountAmount.isZero && (
                <SumRow
                  label="Discount"
                  value={`−${formatMoney(
                    totals.discountAmount.toDecimalString(),
                    currencyCode
                  )}`}
                />
              )}
              <SumRow
                label="Tax"
                value={formatMoney(
                  totals.taxTotal.toDecimalString(),
                  currencyCode
                )}
              />
              <div className="if-sumrow if-total money">
                <strong>Total</strong>
                <strong>
                  {formatMoney(totals.total.toDecimalString(), currencyCode)}
                </strong>
              </div>
            </>
          ) : null}

          <div className="if-depositbox">
            {totals?.deposit ? (
              <>
                <div className="if-dtop">
                  <div>
                    <div className="if-label">Deposit required</div>
                    <div className="if-deposit-meta">
                      {depositSummary(
                        depositType,
                        depositValue,
                        depositDueRule
                      )}
                    </div>
                  </div>
                  <span className="if-amt money">
                    {formatMoney(
                      totals.deposit.required.toDecimalString(),
                      currencyCode
                    )}
                  </span>
                </div>
                <div className="if-sumrow if-deposit-remaining">
                  <span>Remaining</span>
                  <strong>
                    {formatMoney(
                      totals.deposit.remaining.toDecimalString(),
                      currencyCode
                    )}
                  </strong>
                </div>
              </>
            ) : (
              <div className="if-dtop">
                <div>
                  <div className="if-label">Deposit</div>
                  <div className="if-deposit-meta">Not required</div>
                </div>
              </div>
            )}
            <button
              type="button"
              className="if-text-action if-deposit-edit"
              onClick={() => setDepositEditorOpen((open) => !open)}
            >
              {totals?.deposit ? "Edit deposit" : "Add deposit"}
            </button>
          </div>

          {depositEditorOpen && (
            <div className="if-deposit-editor">
              <Select
                label="Deposit type"
                value={depositType}
                onValueChange={(value) =>
                  setDepositType(value as "" | "percentage" | "fixed")
                }
                options={[
                  { value: "", label: "No deposit" },
                  { value: "percentage", label: "Percentage" },
                  { value: "fixed", label: "Fixed amount" },
                ]}
              />
              {depositType !== "" && (
                <>
                  <Input
                    label={
                      depositType === "percentage"
                        ? "Deposit %"
                        : "Deposit amount"
                    }
                    value={depositValue}
                    onChange={(event) => setDepositValue(event.target.value)}
                    sx={{ mt: 2 }}
                  />
                  <Select
                    label="Deposit due"
                    value={depositDueRule}
                    onValueChange={(value) =>
                      setDepositDueRule(value as DepositDueRule)
                    }
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
                      onChange={(event) =>
                        setDepositDueDate(event.target.value)
                      }
                    />
                  )}
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
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
          <span className="if-saved">Changes save on Review</span>
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

function isEmptyItem(item: LineItem | undefined): boolean {
  return (
    Boolean(item) &&
    item!.description.trim() === "" &&
    item!.rate.trim() === "" &&
    !item!.sourceProductServiceId
  );
}

function textToRichText(value: string) {
  return {
    type: "doc" as const,
    content: value.split(/\n+/).map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : [],
    })),
  };
}

function richTextToText(
  document:
    | { content?: readonly { content?: readonly { text?: string }[] }[] }
    | undefined
): string {
  return (
    document?.content
      ?.map(
        (block) => block.content?.map((node) => node.text ?? "").join("") ?? ""
      )
      .join("\n") ?? ""
  );
}

function formatMoney(value: string, currencyCode: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${value} ${currencyCode}`;
  }
}

function depositSummary(
  type: string,
  value: string,
  dueRule: DepositDueRule
): string {
  const amount = type === "percentage" ? `${value || "0"}%` : "Fixed amount";
  const due = {
    on_receipt: "Due on receipt",
    days_7: "Due in 7 days",
    days_15: "Due in 15 days",
    custom: "Custom due date",
  }[dueRule];
  return `${amount} · ${due}`;
}
