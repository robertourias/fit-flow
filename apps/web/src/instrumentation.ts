import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Sem NEXT_PUBLIC_SENTRY_DSN, captureRequestError ainda pode ser referenciado
// (não dispara rede) — o no-op de fato ocorre dentro do Sentry.init condicional
// dos arquivos sentry.*.config.ts.
export const onRequestError = Sentry.captureRequestError;
