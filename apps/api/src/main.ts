import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { initSentry } from "./common/observability/sentry";

async function bootstrap() {
  initSentry();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // ValidationPipe global registrado via APP_PIPE no AppModule (vale também nos testes e2e)
  // /metrics fica fora do prefixo (rota de infra) — /health já é checado em
  // /api/v1/health pelo docker-compose, mantido como está.
  app.setGlobalPrefix("api/v1", { exclude: ["metrics"] });
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle("FitFlow API")
    .setDescription("API REST core — Identity, Catalog, Training")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/v1/docs", app, document);

  const port = process.env["PORT"] ?? 3001;
  await app.listen(port);
}

bootstrap();
