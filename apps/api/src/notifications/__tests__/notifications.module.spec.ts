import { Test } from "@nestjs/testing";
import { getQueueToken } from "@nestjs/bullmq";
import { NotificationsModule } from "../notifications.module";
import { NewMessageNotificationProcessor } from "../infra/queue/new-message-notification.processor";
import { CREATE_NOTIFICATION_USE_CASE } from "../notifications.tokens";

// REDIS_URL aponta para um host fictício: a conexão do ioredis/BullMQ é
// lazy (não conecta na criação do módulo), então o teste valida apenas que
// o módulo compila e os providers ficam disponíveis via DI — não exercita
// uma conexão real com Redis. Isso é validado manualmente/via docker-compose.
describe("NotificationsModule", () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeAll(() => {
    process.env.REDIS_URL = "redis://localhost:6399";
  });

  afterAll(() => {
    process.env.REDIS_URL = originalRedisUrl;
  });

  it("compila e resolve o processor e a fila notifications via DI", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NotificationsModule],
    }).compile();

    expect(moduleRef.get(NewMessageNotificationProcessor)).toBeInstanceOf(
      NewMessageNotificationProcessor,
    );
    expect(moduleRef.get(CREATE_NOTIFICATION_USE_CASE)).toBeDefined();
    expect(moduleRef.get(getQueueToken("notifications"))).toBeDefined();

    await moduleRef.close();
  });
});
