import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  // ─── Swagger / OpenAPI ───────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('OZIRIS API')
    .setDescription(
      'API REST del marketplace musical OZIRIS.\n\n' +
      '**Flujo rápido para probar endpoints protegidos:**\n' +
      '1. Ejecuta `POST /auth/login` con tus credenciales.\n' +
      '2. Copia el campo `access_token` de la respuesta.\n' +
      '3. Haz clic en el botón **Authorize 🔒** (arriba a la derecha) y pega el token.\n' +
      '4. Ahora todos los endpoints marcados con 🔒 funcionarán.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Pega aquí tu JWT (sin el prefijo "Bearer ")',
      },
      'JWT-Auth',
    )
    .addTag('Auth', 'Registro, inicio de sesión y recuperación de contraseña')
    .addTag('Users', 'Gestión de perfiles, favoritos y administración de usuarios (ADMIN)')
    .addTag('Tracks', 'Catálogo de beats — búsqueda, subida y eliminación')
    .addTag('Purchases', 'Simulación de pagos, historial de compras y descargas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'OZIRIS API Docs',
  });
  // ────────────────────────────────────────────────────────────────────────────

  await app.listen(process.env.PORT ?? 4000);
  console.log(`\n🚀 OZIRIS API corriendo en:      http://localhost:${process.env.PORT ?? 4000}`);
  console.log(`📚 Documentación Swagger en:     http://localhost:${process.env.PORT ?? 4000}/api\n`);
}
bootstrap();
