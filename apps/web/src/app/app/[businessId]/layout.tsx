"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import HomeIcon from "@mui/icons-material/Home";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PeopleIcon from "@mui/icons-material/People";
import CategoryIcon from "@mui/icons-material/Category";
import SettingsIcon from "@mui/icons-material/Settings";
import DescriptionIcon from "@mui/icons-material/Description";
import LogoutIcon from "@mui/icons-material/Logout";

import { Button } from "@/components/ui";
import { CurrentBusiness } from "@/components/navigation/BusinessSwitcher";
import { supabase } from "@/lib/supabase";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

export default function BusinessLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    { label: "Dashboard", href: `/app/${businessId}`, icon: <HomeIcon /> },
    { label: "Invoices", href: `/app/${businessId}/invoices`, icon: <ReceiptIcon /> },
    { label: "Quotes", href: `/app/${businessId}/quotes`, icon: <DescriptionIcon /> },
    { label: "Clients", href: `/app/${businessId}/clients`, icon: <PeopleIcon /> },
    { label: "Products", href: `/app/${businessId}/products`, icon: <CategoryIcon /> },
  ];

  function isActive(item: NavItem): boolean {
    if (item.href === `/app/${businessId}`) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  const title = pathname.endsWith("/invoices/new")
    ? "New Invoice"
    : navItems.find((item) => isActive(item))?.label ?? "Invoices";

  return (
    <div className="if-shell">
      <aside className="if-sidebar">
        <div className="if-logo">InvoiceFlow</div>
        <Link href={`/app/${businessId}/settings/businesses`} className="if-business-switch">
          <strong>
            <CurrentBusiness businessId={businessId} />
          </strong>
          <span>Switch</span>
        </Link>

        <nav className="if-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item) ? "if-active" : undefined}
            >
              <span className="if-ico">{item.icon}</span>
              <span className="if-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="if-sidefoot">
          <Link href={`/app/${businessId}/settings/profile`}>
            <span className="if-ico" style={{ width: 18, display: "inline-flex", justifyContent: "center" }}>
              <SettingsIcon />
            </span>
            <span className="if-label">Settings</span>
          </Link>
        </div>
      </aside>

      <div className="if-app-main">
        <header className="if-topbar">
          <div>
            <h1>{title}</h1>
            <div className="if-sub">
              <CurrentBusiness businessId={businessId} />
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Button variant="outlined" size="small" onClick={() => void handleLogout()}>
              <LogoutIcon sx={{ mr: 0.5, fontSize: 16 }} />
              Log out
            </Button>
          </div>
        </header>

        <div className="if-mobile-head">
          <h1>{title}</h1>
        </div>

        <div className="if-page">{children}</div>

        <nav className="if-bottom-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item) ? "if-active" : undefined}
            >
              <span className="if-ico">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <Link
            href={`/app/${businessId}/settings/profile`}
            className={pathname.startsWith(`/app/${businessId}/settings`) ? "if-active" : undefined}
          >
            <span className="if-ico">
              <SettingsIcon />
            </span>
            Settings
          </Link>
        </nav>
      </div>
    </div>
  );
}
