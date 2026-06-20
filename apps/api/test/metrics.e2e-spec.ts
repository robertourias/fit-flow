import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { getQueueToken } from "@nestjs/bullmq";
import { createTestApp, fakeDecode } from "./e2e-utils";
import { NewMessageNotificationProcessor } from "../src/notifications/infra/queue/new-message-notification.processor";

jest.mock("@auth/core/jwt", () => ({
  decode: jest.fn((args: { token: string }) => fakeDecode(args)),
}));

// Mesmo padrão de coaching.e2e-spec.ts: evita depender de Redis real só para
// subir o AppModule completo — este teste não exercita mensagens/notificações.
class FakeNotificationsQueue {
  on(): void {}
  async add(): Promise<void> {}
}
class FakeNewMessageNotificationProcessor {}

describe("GET /metrics (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp([
      { token: getQueueToken("notifications"), value: new FakeNotificationsQueue() },
      { token: NewMessageNotificationProcessor, value: new FakeNewMessageNotificationProcessor() },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it("is reachable outside the /api/v1 prefix, without auth, in Prometheus exposition format", async () => {
    const response = await request(app.getHttpServer()).get("/metrics");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.text).toContain("http_requests_total");
  });

  it("records the request that hit a different route before it", async () => {
    await request(app.getHttpServer()).get("/api/v1/health");

    const response = await request(app.getHttpServer()).get("/metrics");

    expect(response.text).toContain('route="/api/v1/health"');
  });
});
