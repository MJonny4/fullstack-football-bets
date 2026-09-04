import { ValidationPipe, type INestApplication } from "@nestjs/common";

export function configureApp(app: INestApplication) {
  const express = app.getHttpAdapter().getInstance() as { set?: (name: string, value: unknown) => void };
  express.set?.("trust proxy", 1);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : ["http://localhost:8080", "http://localhost:5173"],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableShutdownHooks();
  return app;
}
