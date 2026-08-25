"use client";

import { useMemo, useRef, useState } from "react";
import { Alert, Card, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { Button, Dialog, Input } from "@/components/ui";

/**
 * Design demo for the "Create Invoice" screen, ported 1:1 from sample.html
 * (client picker, item dialog, deposit dialog all included). Runs entirely
 * on local mocked data — no API/auth wiring.
 */

type DemoClient = {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
};

type DemoTax = {
  id: string;
  name: string;
  rate: number; // percent, e.g. 13 = 13%
  isDefault: boolean;
};

type DemoItem = {
  id: string;
  desc: string;
  meta: string;
  qty: number;
  rate: number;
  taxIds: string[];
};

type DepositType = "percent" | "fixed";
type DepositDue = "On receipt" | "7 days" | "15 days";
type Deposit = { type: DepositType; value: number; due: DepositDue };

const INITIAL_CLIENTS: DemoClient[] = [
  { id: "c1", name: "ABC Construction", email: "john@abc.com" },
  { id: "c2", name: "Smith Electric", email: "accounts@smith.ca" },
  { id: "c3", name: "North Design", email: "hello@north.ca" },
  { id: "c4", name: "John Smith", email: "john@example.com" },
  { id: "c5", name: "Julien Co.", email: "hello@julien.co" },
];

const INITIAL_TAXES: DemoTax[] = [
  { id: "hst", name: "HST", rate: 13, isDefault: true },
  { id: "gst", name: "GST", rate: 5, isDefault: false },
  { id: "pst", name: "PST", rate: 7, isDefault: false },
];

const INITIAL_ITEMS: DemoItem[] = [
  {
    id: "i1",
    desc: "Website Design",
    meta: "Project fee",
    qty: 1,
    rate: 1500,
    taxIds: ["hst"],
  },
  {
    id: "i2",
    desc: "Hosting (Monthly)",
    meta: "Monthly hosting",
    qty: 3,
    rate: 30,
    taxIds: ["hst"],
  },
];

function money(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function calculateTotals(
  items: DemoItem[],
  taxes: DemoTax[],
  deposit: Deposit,
) {
  let subtotal = 0;
  const taxMap = new Map<
    string,
    { id: string; name: string; rate: number; amount: number }
  >();

  items.forEach((item) => {
    const amount = item.qty * item.rate;
    subtotal += amount;
    item.taxIds.forEach((taxId) => {
      const tax = taxes.find((t) => t.id === taxId);
      if (!tax) return;
      const entry = taxMap.get(taxId) ?? {
        id: tax.id,
        name: tax.name,
        rate: tax.rate,
        amount: 0,
      };
      entry.amount += amount * (tax.rate / 100);
      taxMap.set(taxId, entry);
    });
  });

  const taxRows = [...taxMap.values()].filter((row) => row.amount > 0.000001);
  const taxTotal = taxRows.reduce((sum, row) => sum + row.amount, 0);
  const total = subtotal + taxTotal;
  const rawDeposit =
    deposit.type === "percent"
      ? (total * deposit.value) / 100
      : Math.min(deposit.value, total);
  const depositAmount = Math.max(0, rawDeposit);
  const remaining = Math.max(0, total - depositAmount);

  return { subtotal, taxRows, taxTotal, total, depositAmount, remaining };
}

function depositSummaryText(deposit: Deposit): string {
  const amountLabel =
    deposit.type === "percent" ? `${deposit.value}%` : "Fixed amount";
  return `${amountLabel} · Due ${deposit.due.toLowerCase()}`;
}

function dialogTitle(text: string, onClose: () => void) {
  return (
    <div className="if-add-item-dialog-title">
      <span>{text}</span>
      <IconButton aria-label={`Close ${text}`} onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}

function ItemTaxEditor({
  taxes,
  value,
  onChange,
  onCreateTax,
}: {
  taxes: DemoTax[];
  value: string[];
  onChange: (next: string[]) => void;
  onCreateTax: (input: {
    name: string;
    rate: number;
    isDefault: boolean;
  }) => string;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  function addExisting() {
    const available = taxes.find((tax) => !value.includes(tax.id));
    if (available) onChange([...value, available.id]);
  }

  function updateRow(index: number, taxId: string) {
    onChange(value.map((id, i) => (i === index ? taxId : id)));
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function submitNewTax() {
    const trimmedName = name.trim();
    const parsedRate = Number(rate);
    if (!trimmedName || !Number.isFinite(parsedRate) || parsedRate <= 0) return;
    const id = onCreateTax({ name: trimmedName, rate: parsedRate, isDefault });
    onChange([...value, id]);
    setName("");
    setRate("");
    setIsDefault(false);
    setCreating(false);
  }

  return (
    <div className="if-dialog-tax-list">
      {value.length === 0 ? (
        <div className="if-dialog-no-tax">No taxes applied</div>
      ) : null}
      {value.map((taxId, index) => (
        <div className="if-dialog-tax-row" key={`${index}-${taxId}`}>
          <select
            className="if-dialog-select"
            aria-label={`Tax ${index + 1}`}
            value={taxId}
            onChange={(event) => updateRow(index, event.target.value)}
          >
            {taxes.map((tax) => (
              <option
                key={tax.id}
                value={tax.id}
                disabled={tax.id !== taxId && value.includes(tax.id)}
              >
                {tax.name} {tax.rate}%
              </option>
            ))}
          </select>
          <IconButton
            aria-label={`Remove tax ${index + 1}`}
            onClick={() => removeRow(index)}
          >
            <CloseIcon />
          </IconButton>
        </div>
      ))}
      <div className="if-dialog-tax-actions">
        {taxes.some((tax) => !value.includes(tax.id)) ? (
          <button
            type="button"
            className="if-dialog-add-tax"
            onClick={addExisting}
          >
            + Add existing tax
          </button>
        ) : null}
        <button
          type="button"
          className="if-dialog-add-tax"
          onClick={() => setCreating((open) => !open)}
        >
          + Create new tax
        </button>
      </div>
      {creating ? (
        <div className="if-dialog-new-tax">
          <div className="if-dialog-field">
            <label htmlFor="new-tax-name">Tax name</label>
            <Input
              id="new-tax-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="PST"
            />
          </div>
          <div className="if-dialog-field">
            <label htmlFor="new-tax-rate">Rate (%)</label>
            <Input
              id="new-tax-rate"
              type="number"
              slotProps={{ htmlInput: { step: "any", min: 0 } }}
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="7"
            />
          </div>
          <Button variant="outlined" onClick={submitNewTax}>
            Add tax
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function InvoiceEditorDemoPage() {
  const [clients, setClients] = useState<DemoClient[]>(INITIAL_CLIENTS);
  const [taxes, setTaxes] = useState<DemoTax[]>(INITIAL_TAXES);
  const [items, setItems] = useState<DemoItem[]>(INITIAL_ITEMS);
  const [selectedClientId, setSelectedClientId] = useState<string>("c1");

  const [invoiceNo, setInvoiceNo] = useState("INV-1052");
  const [issueDate, setIssueDate] = useState("2026-08-17");
  const [dueDate, setDueDate] = useState("2026-09-16");
  const [notes, setNotes] = useState("Thank you for your business.");
  const [poNumber, setPoNumber] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

  const [deposit, setDeposit] = useState<Deposit>({
    type: "percent",
    value: 30,
    due: "On receipt",
  });
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositDraft, setDepositDraft] = useState<Deposit>(deposit);

  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [newClientDialogOpen, setNewClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientError, setNewClientError] = useState<string | null>(null);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemRate, setNewItemRate] = useState("");
  const [newItemTaxIds, setNewItemTaxIds] = useState<string[]>([]);

  const [editTaxesIndex, setEditTaxesIndex] = useState<number | null>(null);
  const [editTaxesDraft, setEditTaxesDraft] = useState<string[]>([]);

  const idCounter = useRef(0);
  function nextId(prefix: string): string {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}`;
  }

  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [savedLabel, setSavedLabel] = useState("Saved ✓");
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pulseSaved() {
    setSavedLabel("Saving…");
    if (savedTimeout.current) clearTimeout(savedTimeout.current);
    savedTimeout.current = setTimeout(() => setSavedLabel("Saved ✓"), 650);
  }

  function showToast(message: string) {
    setToastMessage(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMessage(null), 1800);
  }

  function createTax(input: {
    name: string;
    rate: number;
    isDefault: boolean;
  }): string {
    const id = nextId("tax");
    setTaxes((current) => {
      const next = input.isDefault
        ? current.map((tax) => ({ ...tax, isDefault: false }))
        : current;
      return [
        ...next,
        {
          id,
          name: input.name.toUpperCase(),
          rate: input.rate,
          isDefault: input.isDefault,
        },
      ];
    });
    showToast(`${input.name.toUpperCase()} added`);
    return id;
  }

  const selectedClient = clients.find(
    (client) => client.id === selectedClientId,
  );
  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) =>
      `${client.name} ${client.email}`.toLowerCase().includes(query),
    );
  }, [clients, clientSearch]);

  const totals = useMemo(
    () => calculateTotals(items, taxes, deposit),
    [items, taxes, deposit],
  );
  const depositPreview = useMemo(
    () => calculateTotals(items, taxes, depositDraft),
    [items, taxes, depositDraft],
  );

  function openClientPicker() {
    setClientSearch("");
    setClientDialogOpen(true);
  }

  function selectClient(id: string) {
    setSelectedClientId(id);
    setClientDialogOpen(false);
    pulseSaved();
  }

  function openNewClientDialog() {
    setClientDialogOpen(false);
    setNewClientName("");
    setNewClientCompany("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientError(null);
    setNewClientDialogOpen(true);
  }

  function saveNewClient() {
    const name = newClientCompany.trim() || newClientName.trim();
    if (!name) {
      setNewClientError("Enter a name or company.");
      return;
    }
    const id = nextId("client");
    const client: DemoClient = {
      id,
      name,
      email: newClientEmail.trim(),
      company: newClientCompany.trim() || undefined,
      phone: newClientPhone.trim() || undefined,
    };
    setClients((current) => [client, ...current]);
    setSelectedClientId(id);
    setNewClientDialogOpen(false);
    showToast("Client added");
    pulseSaved();
  }

  function openAddItemDialog() {
    setNewItemDesc("");
    setNewItemQty("1");
    setNewItemRate("");
    setNewItemTaxIds([]);
    setItemDialogOpen(true);
  }

  function confirmAddItem() {
    const desc = newItemDesc.trim();
    if (!desc) return;
    const qty = Math.max(0, Number(newItemQty) || 0);
    const rate = Math.max(0, Number(newItemRate) || 0);
    setItems((current) => [
      ...current,
      {
        id: nextId("item"),
        desc,
        meta: "Custom item",
        qty,
        rate,
        taxIds: newItemTaxIds,
      },
    ]);
    setItemDialogOpen(false);
    pulseSaved();
  }

  function updateItemField(
    index: number,
    field: "qty" | "rate",
    rawValue: string,
  ) {
    const value = Math.max(0, Number(rawValue) || 0);
    setItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
    pulseSaved();
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
    pulseSaved();
  }

  function openEditTaxes(index: number) {
    setEditTaxesIndex(index);
    setEditTaxesDraft([...items[index].taxIds]);
  }

  function saveEditTaxes() {
    if (editTaxesIndex === null) return;
    setItems((current) =>
      current.map((item, i) =>
        i === editTaxesIndex ? { ...item, taxIds: editTaxesDraft } : item,
      ),
    );
    setEditTaxesIndex(null);
    pulseSaved();
  }

  function openDepositDialog() {
    setDepositDraft(deposit);
    setDepositDialogOpen(true);
  }

  function saveDeposit() {
    setDeposit(depositDraft);
    setDepositDialogOpen(false);
    pulseSaved();
  }

  function handleReviewClick() {
    const problems: string[] = [];
    if (!selectedClient) problems.push("Select a client.");
    if (items.length === 0) problems.push("Add at least one invoice item.");
    items.forEach((item, idx) => {
      if (!item.desc) problems.push(`Item ${idx + 1}: add a description.`);
      if (!(item.qty > 0))
        problems.push(`Item ${idx + 1}: quantity must be greater than 0.`);
      if (!(item.rate >= 0))
        problems.push(`Item ${idx + 1}: enter a valid rate.`);
    });
    if (problems.length > 0) {
      setValidationMessage(problems[0]);
      return;
    }
    setValidationMessage(null);
    showToast("Demo only — this would continue to Review & Send.");
  }

  return (
    <div className="if-shell">
      <aside className="if-sidebar">
        <div className="if-logo">InvoiceFlow</div>
        <div className="if-business-switch">
          <strong>Acme Design</strong>
          <span>Demo business</span>
        </div>
        <nav className="if-nav">
          <button type="button">
            <span className="if-ico">⌂</span>
            <span className="if-label">Dashboard</span>
          </button>
          <button type="button" className="if-active">
            <span className="if-ico">▤</span>
            <span className="if-label">Invoices</span>
          </button>
          <button type="button">
            <span className="if-ico">▧</span>
            <span className="if-label">Quotes</span>
          </button>
          <button type="button">
            <span className="if-ico">♙</span>
            <span className="if-label">Clients</span>
          </button>
          <button type="button">
            <span className="if-ico">◫</span>
            <span className="if-label">Products</span>
          </button>
        </nav>
        <div className="if-sidefoot">
          <button type="button">Business Settings</button>
        </div>
      </aside>

      <div className="if-app-main">
        <header className="if-topbar">
          <div>
            <h1>New Invoice</h1>
            <div className="if-sub">Draft autosaves as you work</div>
          </div>
          <span className="if-demo-badge">Demo · Mocked data</span>
        </header>

        <div className="if-page">
          {validationMessage ? (
            <div className="if-validation-banner if-show">
              {validationMessage}
            </div>
          ) : null}

          <section className="if-editor-section">
            <div className="if-eyebrow">Client</div>
            <button
              type="button"
              className="if-client-selector"
              onClick={openClientPicker}
            >
              <div className="if-selector-main">
                <div className="if-avatar">
                  {selectedClient ? initials(selectedClient.name) : "?"}
                </div>
                <div>
                  <strong>{selectedClient?.name ?? "Select a client"}</strong>
                  <span>
                    {selectedClient?.email ?? "Choose who this invoice is for"}
                  </span>
                </div>
              </div>
              <span className="if-selector-change" aria-hidden="true">
                ›
              </span>
            </button>
          </section>

          <section className="if-editor-section">
            <div className="if-eyebrow">Invoice details</div>
            <div className="if-invoice-details">
              <div className="if-dialog-field">
                <label htmlFor="invoice-no">Invoice #</label>
                <Input
                  id="invoice-no"
                  value={invoiceNo}
                  onChange={(event) => {
                    setInvoiceNo(event.target.value);
                    pulseSaved();
                  }}
                />
              </div>
              <div className="if-dialog-field">
                <label htmlFor="issue-date">Issue date</label>
                <Input
                  id="issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(event) => {
                    setIssueDate(event.target.value);
                    pulseSaved();
                  }}
                />
              </div>
              <div className="if-dialog-field">
                <label htmlFor="due-date">Due date</label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => {
                    setDueDate(event.target.value);
                    pulseSaved();
                  }}
                />
              </div>
            </div>
          </section>

          <section className="if-editor-section">
            <div className="if-eyebrow">Items</div>
            <div
              className="if-small if-muted"
              style={{ margin: "-2px 0 10px", fontSize: 12, color: "#667085" }}
            >
              Taxes are optional. Add one or more taxes to an item only when
              needed.
            </div>
            <Card className="if-invoice-items" sx={{ overflow: "hidden" }}>
              <div className="if-row-grid if-row-head if-invoice-item-grid">
                <div>Description</div>
                <div>Qty</div>
                <div>Rate</div>
                <div className="if-right">Amount</div>
                <div />
              </div>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="if-row-grid if-row if-invoice-item-grid"
                >
                  <div className="if-item-description">
                    <strong className="if-item-name-text">{item.desc}</strong>
                    <div className="if-item-detail-text">{item.meta}</div>
                    <div className="if-tax-badge-row">
                      {item.taxIds.length === 0 ? (
                        <span className="if-tax-chip">No tax</span>
                      ) : (
                        item.taxIds.map((taxId) => {
                          const tax = taxes.find((t) => t.id === taxId);
                          return tax ? (
                            <span className="if-tax-chip" key={taxId}>
                              {tax.name} {tax.rate}%
                            </span>
                          ) : null;
                        })
                      )}
                      <button
                        type="button"
                        className="if-tax-chip if-tax-chip-edit"
                        onClick={() => openEditTaxes(index)}
                      >
                        Edit taxes
                      </button>
                    </div>
                  </div>
                  <input
                    className="if-item-inline-input"
                    type="number"
                    min={0}
                    step={0.25}
                    aria-label={`Quantity for ${item.desc}`}
                    value={item.qty}
                    onChange={(event) =>
                      updateItemField(index, "qty", event.target.value)
                    }
                  />
                  <input
                    className="if-item-inline-input"
                    type="number"
                    min={0}
                    step={0.01}
                    aria-label={`Rate for ${item.desc}`}
                    value={item.rate}
                    onChange={(event) =>
                      updateItemField(index, "rate", event.target.value)
                    }
                  />
                  <div className="if-right if-amount money" data-label="Amount">
                    {money(item.qty * item.rate)}
                  </div>
                  <IconButton
                    className="if-item-remove"
                    aria-label={`Remove ${item.desc}`}
                    onClick={() => removeItem(index)}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
              ))}
              <div className="if-item-addbar">
                <button
                  type="button"
                  className="if-text-action"
                  onClick={openAddItemDialog}
                >
                  + Add item
                </button>
              </div>
            </Card>
          </section>

          <div className="if-editor-bottom">
            <div>
              <div className="if-eyebrow">Notes</div>
              <Input
                multiline
                minRows={4}
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  pulseSaved();
                }}
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

              {moreOptionsOpen ? (
                <Card className="if-more-options-panel">
                  <div className="if-options-grid">
                    <Input
                      label="PO #"
                      value={poNumber}
                      onChange={(event) => setPoNumber(event.target.value)}
                      placeholder="Optional"
                    />
                    <Input
                      label="Discount"
                      value={discountValue}
                      onChange={(event) => setDiscountValue(event.target.value)}
                      placeholder="0%"
                    />
                  </div>
                </Card>
              ) : null}
            </div>

            <Card className="if-summary" sx={{ p: 2.25 }}>
              <div className="if-sumrow money">
                <span>Subtotal</span>
                <strong>{money(totals.subtotal)}</strong>
              </div>
              {totals.taxRows.length === 0 ? (
                <div className="if-sumrow money">
                  <span>Tax</span>
                  <strong style={{ color: "#98a2b3" }}>No tax</strong>
                </div>
              ) : (
                totals.taxRows.map((row) => (
                  <div className="if-sumrow money" key={row.id}>
                    <span>
                      {row.name} {row.rate}%
                    </span>
                    <strong>{money(row.amount)}</strong>
                  </div>
                ))
              )}
              <div className="if-sumrow if-total money">
                <strong>Total</strong>
                <strong>{money(totals.total)}</strong>
              </div>

              <div className="if-depositbox">
                <div className="if-dtop">
                  <div>
                    <div className="if-label">Deposit required</div>
                    <div className="if-deposit-meta">
                      {depositSummaryText(deposit)}
                    </div>
                  </div>
                  <span className="if-amt money">
                    {money(totals.depositAmount)}
                  </span>
                </div>
                <div className="if-sumrow" style={{ padding: "8px 0 0" }}>
                  <span>Remaining</span>
                  <strong>{money(totals.remaining)}</strong>
                </div>
                <button
                  type="button"
                  className="if-text-action"
                  style={{ marginTop: 6 }}
                  onClick={openDepositDialog}
                >
                  Edit deposit
                </button>
              </div>
            </Card>
          </div>

          {/* Item dialog */}
          <Dialog
            className="if-add-item-dialog"
            open={itemDialogOpen}
            onClose={() => setItemDialogOpen(false)}
            title={dialogTitle("Add invoice item", () =>
              setItemDialogOpen(false),
            )}
            actions={
              <>
                <Button
                  variant="outlined"
                  onClick={() => setItemDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmAddItem}>Add Item</Button>
              </>
            }
          >
            <div className="if-add-item-form">
              <div className="if-dialog-field if-dialog-field-wide">
                <label htmlFor="new-item-desc">Description</label>
                <Input
                  id="new-item-desc"
                  autoFocus
                  value={newItemDesc}
                  onChange={(event) => setNewItemDesc(event.target.value)}
                  placeholder="Consulting"
                />
              </div>
              <div className="if-dialog-field">
                <label htmlFor="new-item-qty">Quantity</label>
                <Input
                  id="new-item-qty"
                  type="number"
                  slotProps={{ htmlInput: { step: "any", min: 0 } }}
                  value={newItemQty}
                  onChange={(event) => setNewItemQty(event.target.value)}
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
                  placeholder="150"
                />
              </div>
              <div className="if-dialog-field if-dialog-field-wide">
                <label>Taxes</label>
                <ItemTaxEditor
                  taxes={taxes}
                  value={newItemTaxIds}
                  onChange={setNewItemTaxIds}
                  onCreateTax={createTax}
                />
              </div>
            </div>
          </Dialog>

          {/* Edit item taxes dialog */}
          <Dialog
            className="if-add-item-dialog"
            open={editTaxesIndex !== null}
            onClose={() => setEditTaxesIndex(null)}
            title={dialogTitle("Edit Item Taxes", () =>
              setEditTaxesIndex(null),
            )}
            actions={
              <>
                <Button
                  variant="outlined"
                  onClick={() => setEditTaxesIndex(null)}
                >
                  Cancel
                </Button>
                <Button onClick={saveEditTaxes}>Save Taxes</Button>
              </>
            }
          >
            <ItemTaxEditor
              taxes={taxes}
              value={editTaxesDraft}
              onChange={setEditTaxesDraft}
              onCreateTax={createTax}
            />
          </Dialog>

          {/* Client picker dialog */}
          <Dialog
            className="if-add-item-dialog"
            open={clientDialogOpen}
            onClose={() => setClientDialogOpen(false)}
            title={dialogTitle("Select client", () =>
              setClientDialogOpen(false),
            )}
          >
            <Input
              label="Search clients"
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder="Search by name or email"
            />
            <div className="if-library-list">
              {filteredClients.length === 0 ? (
                <div className="if-library-empty">
                  No clients match your search.
                </div>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="if-library-row"
                    onClick={() => selectClient(client.id)}
                  >
                    <div className="if-selector-main">
                      <div className="if-avatar">{initials(client.name)}</div>
                      <div>
                        <strong>{client.name}</strong>
                        <span>{client.email || "No email"}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 20, color: "#98a2b3" }}>›</span>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              className="if-text-action"
              style={{ marginTop: 12 }}
              onClick={openNewClientDialog}
            >
              + Add new client
            </button>
          </Dialog>

          {/* New client dialog */}
          <Dialog
            className="if-add-item-dialog"
            open={newClientDialogOpen}
            onClose={() => setNewClientDialogOpen(false)}
            title={dialogTitle("New Client", () =>
              setNewClientDialogOpen(false),
            )}
            actions={
              <>
                <Button
                  variant="outlined"
                  onClick={() => setNewClientDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveNewClient}>Add Client</Button>
              </>
            }
          >
            <div className="if-add-item-form">
              <div className="if-dialog-field">
                <label htmlFor="nc-name">Name</label>
                <Input
                  id="nc-name"
                  value={newClientName}
                  onChange={(event) => setNewClientName(event.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="if-dialog-field">
                <label htmlFor="nc-company">Company</label>
                <Input
                  id="nc-company"
                  value={newClientCompany}
                  onChange={(event) => setNewClientCompany(event.target.value)}
                  placeholder="ABC Construction"
                />
              </div>
              <div className="if-dialog-field if-dialog-field-wide">
                <label htmlFor="nc-email">Email</label>
                <Input
                  id="nc-email"
                  value={newClientEmail}
                  onChange={(event) => setNewClientEmail(event.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="if-dialog-field if-dialog-field-wide">
                <label htmlFor="nc-phone">Phone</label>
                <Input
                  id="nc-phone"
                  value={newClientPhone}
                  onChange={(event) => setNewClientPhone(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              {newClientError ? (
                <Alert severity="error" className="if-dialog-field-wide">
                  {newClientError}
                </Alert>
              ) : null}
            </div>
          </Dialog>

          {/* Deposit dialog */}
          <Dialog
            className="if-add-item-dialog"
            open={depositDialogOpen}
            onClose={() => setDepositDialogOpen(false)}
            title={dialogTitle("Deposit", () => setDepositDialogOpen(false))}
            actions={
              <>
                <Button
                  variant="outlined"
                  onClick={() => setDepositDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveDeposit}>Save Deposit</Button>
              </>
            }
          >
            <div className="if-segmented">
              <button
                type="button"
                className={
                  depositDraft.type === "percent" ? "if-active" : undefined
                }
                onClick={() =>
                  setDepositDraft((current) => ({
                    ...current,
                    type: "percent",
                  }))
                }
              >
                Percentage
              </button>
              <button
                type="button"
                className={
                  depositDraft.type === "fixed" ? "if-active" : undefined
                }
                onClick={() =>
                  setDepositDraft((current) => ({ ...current, type: "fixed" }))
                }
              >
                Fixed amount
              </button>
            </div>
            <div className="if-dialog-field">
              <label htmlFor="deposit-value">
                {depositDraft.type === "percent"
                  ? "Deposit percentage"
                  : "Deposit amount"}
              </label>
              <Input
                id="deposit-value"
                type="number"
                slotProps={{ htmlInput: { step: "any", min: 0 } }}
                value={depositDraft.value}
                onChange={(event) =>
                  setDepositDraft((current) => ({
                    ...current,
                    value: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
              />
            </div>
            <div className="if-dialog-field" style={{ marginTop: 14 }}>
              <label htmlFor="deposit-due">Deposit due</label>
              <select
                id="deposit-due"
                className="if-dialog-select"
                value={depositDraft.due}
                onChange={(event) =>
                  setDepositDraft((current) => ({
                    ...current,
                    due: event.target.value as DepositDue,
                  }))
                }
              >
                <option>On receipt</option>
                <option>7 days</option>
                <option>15 days</option>
              </select>
            </div>
            <div className="if-preview-grid">
              <Card className="if-preview-card">
                <span>Deposit</span>
                <strong>{money(depositPreview.depositAmount)}</strong>
              </Card>
              <Card className="if-preview-card">
                <span>Remaining</span>
                <strong>{money(depositPreview.remaining)}</strong>
              </Card>
            </div>
          </Dialog>
        </div>

        <div className="if-sticky-editor">
          <div className="if-sticky-inner">
            <span className="if-saved">{savedLabel}</span>
            <Button
              type="button"
              onClick={handleReviewClick}
              sx={{ height: 44, padding: "0 24px" }}
            >
              Review Invoice →
            </Button>
          </div>
        </div>
      </div>

      {toastMessage ? (
        <div className={`if-toast${toastMessage ? " if-show" : ""}`}>
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
