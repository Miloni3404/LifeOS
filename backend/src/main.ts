import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Suppress NestJS boot logs in production
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  // const port = configService.get<number>('app.port', 3001);
  const port = process.env.PORT || configService.get<number>('app.port', 3002);
  const frontendUrl = configService.get<string>(
    'app.frontendUrl',
    'http://localhost:3000',
  );
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');

  // Global API prefix — all routes become /api/...
  app.setGlobalPrefix(apiPrefix);

  // CORS — allow the Next.js frontend
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe — runs class-validator on all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: false,
      transform: true, // auto-transform query params to correct types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Class serializer — respects @Exclude() decorator (hides password from responses)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger API documentation — available at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LifeOS API')
    .setDescription('Personal Life Management System — full API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Users')
    .addTag('Tasks')
    .addTag('Habits')
    .addTag('Logs')
    .addTag('Insights')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true, // remember auth token in Swagger UI
    },
  });

  await app.listen(port);

  console.log(`\n🚀 LifeOS Backend running at http://localhost:${port}`);
  console.log(`📖 Swagger docs at  http://localhost:${port}/${apiPrefix}/docs`);
  console.log(`🌍 Environment:     ${configService.get('app.nodeEnv')}\n`);
}

bootstrap();
