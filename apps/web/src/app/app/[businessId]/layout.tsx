"use client";

import Link from "next/link";
import type { Route } from "next";
import { useParams, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PeopleIcon from "@mui/icons-material/People";
import CategoryIcon from "@mui/icons-material/Category";
import SettingsIcon from "@mui/icons-material/Settings";

type NavItem = {
  label: string;
  href: Route;
  icon: ReactNode;
};

export default function BusinessLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: "Dashboard", href: `/app/${businessId}` as Route, icon: <HomeIcon /> },
    { label: "Invoices", href: `/app/${businessId}/invoices` as Route, icon: <ReceiptIcon /> },
    { label: "Clients", href: `/app/${businessId}/clients` as Route, icon: <PeopleIcon /> },
    { label: "Products", href: `/app/${businessId}/products` as Route, icon: <CategoryIcon /> },
    { label: "Settings", href: `/app/${businessId}/settings/profile` as Route, icon: <SettingsIcon /> },
  ];

  function isActive(item: NavItem): boolean {
    if (item.href === `/app/${businessId}`) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Box
        component="aside"
        sx={{
          width: 220,
          borderRight: 1,
          borderColor: "divider",
          px: 1.5,
          py: 2,
          display: { xs: "none", md: "block" },
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <Typography variant="h6" component="div" sx={{ px: 1.5, pb: 2 }}>
          InvoiceFlow
        </Typography>
        <List dense>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <ListItemButton
                selected={isActive(item)}
                sx={{ borderRadius: 1, color: isActive(item) ? "primary.main" : "inherit" }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </Link>
          ))}
        </List>
      </Box>

      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ flexGrow: 1 }}>{children}</Box>
        <Box
          component="nav"
          sx={{
            display: { xs: "flex", md: "none" },
            borderTop: 1,
            borderColor: "divider",
            position: "sticky",
            bottom: 0,
            background: "background.paper",
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                textDecoration: "none",
                textAlign: "center",
                padding: "10px 0",
                color: isActive(item) ? "var(--mui-palette-primary-main)" : "inherit",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center" }}>{item.icon}</Box>
              <Typography variant="caption">{item.label}</Typography>
            </Link>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
