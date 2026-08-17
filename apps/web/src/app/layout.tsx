import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { WebThemeProvider } from "@/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "InvoiceFlow",
  description: "InvoiceFlow web application",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <WebThemeProvider>{children}</WebThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
