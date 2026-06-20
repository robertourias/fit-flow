import * as Sentry from "@sentry/nestjs";

jest.mock("@sentry/nestjs", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

describe("observability/sentry", () => {
  const originalDsn = process.env["SENTRY_DSN"];

  afterEach(() => {
    if (originalDsn === undefined) {
      delete process.env["SENTRY_DSN"];
    } else {
      process.env["SENTRY_DSN"] = originalDsn;
    }
    jest.clearAllMocks();
  });

  describe("initSentry()", () => {
    it("does not call Sentry.init when SENTRY_DSN is not set", async () => {
      delete process.env["SENTRY_DSN"];
      const { initSentry } = await import("../sentry");

      initSentry();

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it("calls Sentry.init with the DSN when SENTRY_DSN is set", async () => {
      process.env["SENTRY_DSN"] = "https://fake-dsn@sentry.example/1";
      const { initSentry } = await import("../sentry");

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({ dsn: "https://fake-dsn@sentry.example/1" }),
      );
    });
  });

  describe("captureException()", () => {
    it("does not report to Sentry when SENTRY_DSN is not set", async () => {
      delete process.env["SENTRY_DSN"];
      const { captureException } = await import("../sentry");

      captureException(new Error("boom"));

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it("reports to Sentry when SENTRY_DSN is set", async () => {
      process.env["SENTRY_DSN"] = "https://fake-dsn@sentry.example/1";
      const { captureException } = await import("../sentry");
      const error = new Error("boom");

      captureException(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });
});
