-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "rol" AS ENUM ('USER', 'ADMIN', 'PRODUCER', 'BUYER');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "nombre_artistico" TEXT,
    "ubicacion" TEXT,
    "url_avatar" TEXT,
    "biografia" TEXT,
    "rol" "rol" NOT NULL DEFAULT 'USER',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "codigo_recuperacion" TEXT,
    "expiracion_codigo" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pistas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "url_portada" TEXT,
    "url_audio" TEXT NOT NULL,
    "url_audio_completo" TEXT,
    "url_wav" TEXT,
    "url_stems" TEXT,
    "genero" TEXT,
    "bpm" INTEGER,
    "tonalidad" TEXT,
    "etiquetas" TEXT[],
    "reproducciones" INTEGER NOT NULL DEFAULT 0,
    "descargas" INTEGER NOT NULL DEFAULT 0,
    "vendido" BOOLEAN NOT NULL DEFAULT false,
    "productor_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'COMPLETED',
    "metodo_pago" TEXT DEFAULT 'SIMULATED',
    "tipo_licencia" TEXT DEFAULT 'STANDARD',
    "transaccion_id" TEXT,
    "nombre_pagador" TEXT,
    "correo_pagador" TEXT,
    "telefono_pagador" TEXT,
    "documento_pagador" TEXT,
    "proveedor_pago" TEXT,
    "conteo_descargas" INTEGER NOT NULL DEFAULT 0,
    "ultima_descarga_en" TIMESTAMP(3),
    "usuario_id" TEXT NOT NULL,
    "pista_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulaciones_pago" (
    "id" TEXT NOT NULL,
    "transaccion_id" TEXT NOT NULL,
    "metodo" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "estado" TEXT NOT NULL DEFAULT 'APPROVED',
    "nombre_pagador" TEXT,
    "correo_pagador" TEXT,
    "telefono_pagador" TEXT,
    "documento_pagador" TEXT,
    "nombre_banco" TEXT,
    "tipo_persona" TEXT,
    "titular_tarjeta" TEXT,
    "ultimos_cuatro_tarjeta" TEXT,
    "numero_telefono" TEXT,
    "metadatos" JSONB,
    "usuario_id" TEXT NOT NULL,
    "compra_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulaciones_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_descargas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "pista_id" TEXT NOT NULL,
    "compra_id" TEXT,
    "direccion_ip" TEXT,
    "agente_usuario" TEXT,
    "formato_archivo" TEXT DEFAULT 'MP3',
    "tamano_archivo" INTEGER,
    "descargado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_descargas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_licencia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "caracteristicas" TEXT[],
    "incluye_wav" BOOLEAN NOT NULL DEFAULT false,
    "incluye_stems" BOOLEAN NOT NULL DEFAULT false,
    "es_exclusivo" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planes_licencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "pista_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restablecimiento_contrasenas" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "usado_en" TIMESTAMP(3),
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "direccion_ip" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" TEXT NOT NULL,

    CONSTRAINT "restablecimiento_contrasenas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artistas" (
    "id" TEXT NOT NULL,
    "nombre_artistico" TEXT NOT NULL,
    "biografia" TEXT,
    "genero_principal" TEXT,
    "url_portada" TEXT,
    "url_spotify" TEXT,
    "url_instagram" TEXT,
    "url_youtube" TEXT,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "usuario_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artistas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "compras_transaccion_id_key" ON "compras"("transaccion_id");

-- CreateIndex
CREATE UNIQUE INDEX "simulaciones_pago_transaccion_id_key" ON "simulaciones_pago"("transaccion_id");

-- CreateIndex
CREATE UNIQUE INDEX "simulaciones_pago_compra_id_key" ON "simulaciones_pago"("compra_id");

-- CreateIndex
CREATE UNIQUE INDEX "planes_licencia_nombre_key" ON "planes_licencia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "favoritos_usuario_id_pista_id_key" ON "favoritos"("usuario_id", "pista_id");

-- CreateIndex
CREATE INDEX "restablecimiento_contrasenas_correo_idx" ON "restablecimiento_contrasenas"("correo");

-- CreateIndex
CREATE INDEX "restablecimiento_contrasenas_codigo_idx" ON "restablecimiento_contrasenas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "artistas_usuario_id_key" ON "artistas"("usuario_id");

-- AddForeignKey
ALTER TABLE "pistas" ADD CONSTRAINT "pistas_productor_id_fkey" FOREIGN KEY ("productor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_pista_id_fkey" FOREIGN KEY ("pista_id") REFERENCES "pistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulaciones_pago" ADD CONSTRAINT "simulaciones_pago_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulaciones_pago" ADD CONSTRAINT "simulaciones_pago_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_descargas" ADD CONSTRAINT "registros_descargas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_descargas" ADD CONSTRAINT "registros_descargas_pista_id_fkey" FOREIGN KEY ("pista_id") REFERENCES "pistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_descargas" ADD CONSTRAINT "registros_descargas_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_pista_id_fkey" FOREIGN KEY ("pista_id") REFERENCES "pistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restablecimiento_contrasenas" ADD CONSTRAINT "restablecimiento_contrasenas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artistas" ADD CONSTRAINT "artistas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

