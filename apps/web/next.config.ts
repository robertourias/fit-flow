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
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "**": ["../../node_modules/.pnpm/@prisma+client*/**/.prisma/client/*query_engine-*.node"],
  },
  transpilePackages: ["@fitflow/ui", "@fitflow/utils", "@fitflow/types", "@fitflow/db"],
};

export default withBundleAnalyzer(nextConfig);
