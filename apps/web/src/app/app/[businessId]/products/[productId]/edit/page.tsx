"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ApiClient,
  type CreateProductInput,
  type ProductService,
} from "@invoiceflow/api-client";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

import { ProductForm } from "@/components/products/ProductForm";
import { supabase } from "@/lib/supabase";

const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function EditProductPage() {
  const params = useParams<{ businessId: string; productId: string }>();
  const { businessId, productId } = params;
  const router = useRouter();
  const [product, setProduct] = useState<ProductService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) {
          setError("You must be signed in.");
          setLoading(false);
        }
        return;
      }

      try {
        const result = await apiClient.getProduct(
          businessId,
          productId,
          session.access_token,
        );
        if (!cancelled) {
          setProduct(result);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load item.",
          );
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId, productId]);

  async function handleSubmit(input: CreateProductInput) {
    setError(null);
    setSubmitting(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("You must be signed in to update an item.");
      setSubmitting(false);
      return;
    }

    try {
      await apiClient.updateProduct(
        businessId,
        productId,
        input,
        session.access_token,
      );
      router.push(`/app/${businessId}/products`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to update item.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Box sx={{ maxWidth: 520, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Item
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !product && <Alert severity="error">{error}</Alert>}

        {!loading && product && (
          <ProductForm
            initial={{
              type: product.type,
              name: product.name,
              description: product.description,
              defaultRate: product.defaultRate,
              unit: product.unit,
            }}
            submitLabel="Save changes"
            error={error}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </Box>
    </main>
  );
}
