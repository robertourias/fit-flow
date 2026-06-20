const mockInit = jest.fn();
const mockCaptureRouterTransitionStart = jest.fn();
const mockCaptureRequestError = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  init: mockInit,
  captureRouterTransitionStart: mockCaptureRouterTransitionStart,
  captureRequestError: mockCaptureRequestError,
}));

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("instrumentation-client", () => {
  it("não chama Sentry.init quando NEXT_PUBLIC_SENTRY_DSN está ausente", async () => {
    await jest.isolateModulesAsync(async () => {
      await import("../instrumentation-client");
    });

    expect(mockInit).not.toHaveBeenCalled();
  });

  it("chama Sentry.init quando NEXT_PUBLIC_SENTRY_DSN está definido", async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://fake-dsn@example.ingest.sentry.io/1";

    await jest.isolateModulesAsync(async () => {
      await import("../instrumentation-client");
    });

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://fake-dsn@example.ingest.sentry.io/1" })
    );
  });

  it("exporta onRouterTransitionStart vinculado ao SDK", async () => {
    const mod = await import("../instrumentation-client");

    expect(mod.onRouterTransitionStart).toBe(mockCaptureRouterTransitionStart);
  });
});

describe("sentry.server.config", () => {
  it("não chama Sentry.init quando NEXT_PUBLIC_SENTRY_DSN está ausente", async () => {
    await jest.isolateModulesAsync(async () => {
      await import("../sentry.server.config");
    });

    expect(mockInit).not.toHaveBeenCalled();
  });

  it("chama Sentry.init quando NEXT_PUBLIC_SENTRY_DSN está definido", async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://fake-dsn@example.ingest.sentry.io/1";

    await jest.isolateModulesAsync(async () => {
      await import("../sentry.server.config");
    });

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://fake-dsn@example.ingest.sentry.io/1" })
    );
  });
});

describe("sentry.edge.config", () => {
  it("não chama Sentry.init quando NEXT_PUBLIC_SENTRY_DSN está ausente", async () => {
    await jest.isolateModulesAsync(async () => {
      await import("../sentry.edge.config");
    });

    expect(mockInit).not.toHaveBeenCalled();
  });

  it("chama Sentry.init quando NEXT_PUBLIC_SENTRY_DSN está definido", async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://fake-dsn@example.ingest.sentry.io/1";

    await jest.isolateModulesAsync(async () => {
      await import("../sentry.edge.config");
    });

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://fake-dsn@example.ingest.sentry.io/1" })
    );
  });
});

describe("instrumentation", () => {
  it("register() importa sentry.server.config quando NEXT_RUNTIME é nodejs", async () => {
    process.env.NEXT_RUNTIME = "nodejs";

    await jest.isolateModulesAsync(async () => {
      const mod = await import("../instrumentation");
      await mod.register();
    });

    delete process.env.NEXT_RUNTIME;
  });

  it("register() importa sentry.edge.config quando NEXT_RUNTIME é edge", async () => {
    process.env.NEXT_RUNTIME = "edge";

    await jest.isolateModulesAsync(async () => {
      const mod = await import("../instrumentation");
      await mod.register();
    });

    delete process.env.NEXT_RUNTIME;
  });

  it("exporta onRequestError vinculado ao SDK", async () => {
    const mod = await import("../instrumentation");

    expect(mod.onRequestError).toBe(mockCaptureRequestError);
  });
});
