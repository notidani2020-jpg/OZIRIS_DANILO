import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class SimulatedPurchaseDto {
  @ApiPropertyOptional({ example: 'track-1', description: 'ID del beat a comprar (compra individual)' })
  @IsOptional()
  @IsString()
  trackId?: string;

  @ApiPropertyOptional({ example: ['track-1', 'track-2'], description: 'Lista de IDs para compra en carrito múltiple' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  trackIds?: string[];

  @ApiPropertyOptional({ example: 'PSE', enum: ['PSE', 'Tarjeta', 'Nequi', 'Bancolombia'], default: 'PSE' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'ESTÁNDAR COMERCIAL (MP3 HQ)', default: 'ESTÁNDAR COMERCIAL (MP3 HQ)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  licenseType?: string;

  @ApiPropertyOptional({ example: 29.99, description: 'Monto total pagado en USD' })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: 'Carlos Mendoza', description: 'Nombre del pagador' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  payerName?: string;

  @ApiPropertyOptional({ example: 'carlos@oziris.test', description: 'Correo del pagador' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  payerEmail?: string;

  @ApiPropertyOptional({ example: '+57 300 1234567', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  payerPhone?: string;

  @ApiPropertyOptional({ example: '1020304050', description: 'Documento de identidad' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  payerDocument?: string;

  @ApiPropertyOptional({ example: 'Bancolombia', description: 'Banco emisor (método PSE)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankName?: string;

  @ApiPropertyOptional({ example: 'Persona natural', enum: ['Persona natural', 'Persona jurídica'] })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  personType?: string;

  @ApiPropertyOptional({ example: 'Carlos Mendoza', description: 'Nombre en la tarjeta' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cardHolder?: string;

  @ApiPropertyOptional({ example: '4242', description: 'Últimos 4 dígitos de tarjeta' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cardLastFour?: string;

  @ApiPropertyOptional({ example: '3001234567', description: 'Número telefónico billetera virtual' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Metadatos complementarios' })
  @IsOptional()
  metadata?: any;
}
