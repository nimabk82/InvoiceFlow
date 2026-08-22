"use client";

import Link from "next/link";
import type { Route } from "next";
import { useParams, usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

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
    { label: "Document Themes", href: `/app/${businessId}/settings/themes` as Route },
    { label: "Payments", href: `/app/${businessId}/settings/payments` as Route },
    { label: "Branding", href: `/app/${businessId}/settings/branding` as Route },
    { label: "Numbering", href: `/app/${businessId}/settings/numbering` as Route },
    { label: "Manage Businesses", href: `/app/${businessId}/settings/businesses` as Route },
  ];

  return (
    <div className="if-settings">
      <nav className="if-card if-settings-nav" style={{ padding: 10, alignSelf: "start" }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{ textDecoration: "none", display: "block" }}
          >
            <button
              className={pathname === item.href ? "if-active" : undefined}
              style={navButtonStyle}
            >
              {item.label}
            </button>
          </Link>
        ))}
      </nav>
      <div className="if-card if-settings-panel" style={{ padding: 22 }}>
        {children}
      </div>
    </div>
  );
}

const navButtonStyle: CSSProperties = {
  width: "100%",
  border: 0,
  background: "transparent",
  borderRadius: 8,
  textAlign: "left",
  padding: "10px 12px",
  color: "#667085",
  fontSize: 13,
  fontWeight: 650,
  cursor: "pointer",
};
