import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ValidationPipe global registrado via APP_PIPE no AppModule (vale também nos testes e2e)
  app.setGlobalPrefix("api/v1");
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
