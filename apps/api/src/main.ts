import { existsSync } from 'fs';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Nạp .env theo thứ tự: apps/api/.env rồi tới .env ở thư mục gốc monorepo (nơi .env.example hướng dẫn tạo).
// process.loadEnvFile không ghi đè biến đã có nên file nạp trước được ưu tiên.
for (const envPath of ['.env', join(__dirname, '..', '..', '..', '.env')]) {
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BrewLite API')
    .setDescription('Hệ thống đặt đồ uống trực tuyến BrewLite - Swagger API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
