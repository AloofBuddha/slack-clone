import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Safe debug: log DB host (no credentials) to verify env usage at runtime
  try {
    const db = process.env.DATABASE_URL;
    if (db) {
      const u = new URL(db);
      console.log(`[Startup] DATABASE_URL host: ${u.hostname}, db: ${u.pathname.replace('/', '')}, sslmode: ${u.searchParams.get('sslmode') || 'none'}`);
    } else {
      console.log('[Startup] DATABASE_URL is not set');
    }
  } catch (e) {
    console.log('[Startup] Could not parse DATABASE_URL');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  console.log(`📚 API documentation: http://0.0.0.0:${port}/api`);
}

bootstrap();
