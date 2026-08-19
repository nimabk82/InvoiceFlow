"use client";

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
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

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
    <main>
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Products &amp; Services
        </Typography>

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
          <Paper elevation={1}>
            <List>
              {products.map((product) => (
                <ListItem key={product.id} divider>
                  <ListItemText
                    primary={product.name}
                    secondary={product.description ?? product.type}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </main>
  );
}
