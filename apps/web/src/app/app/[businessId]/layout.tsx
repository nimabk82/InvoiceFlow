"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import HomeIcon from "@mui/icons-material/Home";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PeopleIcon from "@mui/icons-material/People";
import CategoryIcon from "@mui/icons-material/Category";
import SettingsIcon from "@mui/icons-material/Settings";

import { CurrentBusiness } from "@/components/navigation/BusinessSwitcher";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

export default function BusinessLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: "Dashboard", href: `/app/${businessId}`, icon: <HomeIcon /> },
    { label: "Invoices", href: `/app/${businessId}/invoices`, icon: <ReceiptIcon /> },
    { label: "Clients", href: `/app/${businessId}/clients`, icon: <PeopleIcon /> },
    { label: "Products", href: `/app/${businessId}/products`, icon: <CategoryIcon /> },
  ];

  function isActive(item: NavItem): boolean {
    if (item.href === `/app/${businessId}`) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  }

  const title = navItems.find((item) => isActive(item))?.label ?? "Invoices";

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
