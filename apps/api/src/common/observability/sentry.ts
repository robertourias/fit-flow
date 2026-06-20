import * as Sentry from "@sentry/nestjs";

/**
 * Inicializa o Sentry apenas se SENTRY_DSN estiver definido no ambiente.
 * Sem a env var, `Sentry.init` nunca é chamado — zero chamada de rede,
 * zero side-effect no boot (FR-004/T3).
 */
export function initSentry(): void {
  const dsn = process.env["SENTRY_DSN"];
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env["NODE_ENV"] ?? "development",
    tracesSampleRate: 1.0,
  });
}

/** Reporta uma exceção ao Sentry — no-op se o SDK não foi inicializado (sem DSN). */
export function captureException(exception: unknown): void {
  if (!process.env["SENTRY_DSN"]) {
    return;
  }
  Sentry.captureException(exception);
}
