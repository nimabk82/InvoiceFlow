"use client";

import Link from "next/link";
import type { Route } from "next";
import { useParams, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Box, List, ListItemButton, ListItemText, Stack } from "@mui/material";

type SettingsItem = { label: string; href: Route };

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const pathname = usePathname();

  const items: SettingsItem[] = [
    { label: "Business Profile", href: `/app/${businessId}/settings/profile` as Route },
    { label: "Document Defaults", href: `/app/${businessId}/settings/documents` as Route },
    { label: "Taxes", href: `/app/${businessId}/settings/taxes` as Route },
    { label: "Payments", href: `/app/${businessId}/settings/payments` as Route },
    { label: "Branding", href: `/app/${businessId}/settings/branding` as Route },
    { label: "Numbering", href: `/app/${businessId}/settings/numbering` as Route },
    { label: "Manage Businesses", href: `/app/${businessId}/settings/businesses` as Route },
  ];

  return (
    <Stack direction="row" sx={{ gap: 3, maxWidth: 960, mx: "auto", px: 2, py: 4 }}>
      <Box
        component="nav"
        sx={{ width: 220, flexShrink: 0, display: { xs: "none", sm: "block" } }}
      >
        <List dense>
          {items.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <ListItemButton
                selected={pathname === item.href}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </Link>
          ))}
        </List>
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}
