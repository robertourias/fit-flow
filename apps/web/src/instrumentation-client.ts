import * as Sentry from "@sentry/nextjs";

// Sentry só inicializa se NEXT_PUBLIC_SENTRY_DSN estiver definido — sem a env var,
// este módulo é no-op (nenhuma chamada de rede, nenhum side-effect de import).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
  });
}

// Exigido pelo SDK para instrumentar navegações do App Router (no-op sem DSN,
// pois Sentry.captureRouterTransitionStart é seguro de chamar mesmo sem init).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
