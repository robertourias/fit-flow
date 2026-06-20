import path from "path";
import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

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

// withSentryConfig só injeta plugins de build (upload de source maps, tunneling de rotas)
// e é seguro chamar mesmo sem DSN/auth token configurados — o wrap não faz Sentry.init,
// isso é feito condicionalmente nos arquivos sentry.*.config.ts / instrumentation-client.ts.
export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  silent: true,
  disableLogger: true,
  widenClientFileUpload: false,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  telemetry: false,
});
