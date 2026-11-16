import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const port = process.env.PORT || 3001;
  app.enableCors({ origin: 'http://localhost:3000' });
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
