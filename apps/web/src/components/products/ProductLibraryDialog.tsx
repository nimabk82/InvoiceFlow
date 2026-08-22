"use client";

import { useMemo, useState } from "react";
import type { ProductService } from "@invoiceflow/api-client";

import { Button, Dialog, Input } from "@/components/ui";

type ProductLibraryDialogProps = {
  open: boolean;
  products: readonly ProductService[];
  onClose: () => void;
  onSelect: (product: ProductService) => void;
};

export function ProductLibraryDialog({
  open,
  products,
  onClose,
  onSelect,
}: ProductLibraryDialogProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      `${product.name} ${product.description ?? ""}`.toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add from library"
      actions={
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <Input
        label="Search items"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name or description"
      />

      <div className="if-library-list">
        {filtered.length === 0 && (
          <div className="if-library-empty">
            {products.length === 0
              ? "No saved items yet. Add items in Products to build your library."
              : "No items match your search."}
          </div>
        )}
        {filtered.map((product) => (
          <button
            key={product.id}
            type="button"
            className="if-library-row"
            onClick={() => {
              onSelect(product);
              onClose();
            }}
          >
            <div className="if-selector-main">
              <div className="if-avatar">
                {product.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>{product.name}</strong>
                <span>
                  {product.description ??
                    (product.type === "service" ? "Service" : "Product")}
                </span>
              </div>
            </div>
            {product.defaultRate && (
              <span className="money if-library-rate">{product.defaultRate}</span>
            )}
          </button>
        ))}
      </div>
    </Dialog>
  );
}