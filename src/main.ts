import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // or ['http://localhost:3001', 'https://my-frontend.com', etc.]
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, x-api-key',
    credentials: false, // or true, if you need cookies
  });

  await app.listen(3000);
}
bootstrap();
