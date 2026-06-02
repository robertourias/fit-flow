import path from "path";
import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Necessário em monorepos: faz o file tracing incluir packages/ e gera o
  // standalone com o caminho apps/web/server.js relativo à raiz do monorepo,
  // compatível com o CMD do Dockerfile ("node apps/web/server.js").
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@fitflow/ui", "@fitflow/utils", "@fitflow/types"],
};

export default withBundleAnalyzer(nextConfig);
