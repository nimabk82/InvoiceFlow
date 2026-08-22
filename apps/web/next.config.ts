import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@invoiceflow/api-client",
    "@invoiceflow/calculations",
    "@invoiceflow/design-tokens",
    "@invoiceflow/domain",
    "@invoiceflow/document-schema",
    "@invoiceflow/renderer",
    "@invoiceflow/theme-schema",
    "@invoiceflow/validation",
  ],
};

export default nextConfig;
