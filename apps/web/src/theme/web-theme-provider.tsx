"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

import { invoiceFlowTheme } from "./theme";

type WebThemeProviderProps = Readonly<{
  children: ReactNode;
}>;

export function WebThemeProvider({ children }: WebThemeProviderProps) {
  return (
    <ThemeProvider theme={invoiceFlowTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
