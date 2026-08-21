"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ApiClient,
  type ProductService,
} from "@invoiceflow/api-client";
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

import { Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function ProductsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [products, setProducts] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) {
          setError("You must be signed in to view products.");
          setLoading(false);
        }
        return;
      }

      try {
        const page = await apiClient.listProducts(
          businessId,
          session.access_token,
        );
        if (!cancelled) {
          setProducts([...page.items]);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Failed to load products.",
          );
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return (
    <div>
      <div className="if-toolbar">
        <Link href={`/app/${businessId}/products/new`} style={{ textDecoration: "none", marginLeft: "auto" }}>
          <Button>+ New Item</Button>
        </Link>
      </div>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && products.length === 0 && (
        <Typography variant="body1" color="text.secondary">
          No products or services yet.
        </Typography>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="if-entity-grid">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/app/${businessId}/products/${product.id}/edit`}
              style={{ textDecoration: "none" }}
            >
              <div className="if-entity" style={{ padding: 16, border: "1px solid #E4E7EC", borderRadius: 14, background: "#fff" }}>
                <h3 style={{ fontSize: 14, margin: 0, color: "#101828" }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: 12, color: "#667085", margin: "5px 0" }}>
                  {product.description ?? product.type}
                </p>
                {product.defaultRate && (
                  <div className="money" style={{ marginTop: 16, fontSize: 12, color: "#667085" }}>
                    <strong style={{ float: "right", color: "#101828", fontSize: 14 }}>{product.defaultRate}</strong>
                    Default rate
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
