import { ApiPropertyOptional } from '@nestjs/swagger';

export class SimulatedPurchaseDto {
  @ApiPropertyOptional({ example: 'track-1', description: 'ID del beat a comprar (compra individual)' })
  trackId?: string;

  @ApiPropertyOptional({ example: ['track-1', 'track-2'], description: 'Lista de IDs para compra en carrito múltiple' })
  trackIds?: string[];

  @ApiPropertyOptional({ example: 'PSE', enum: ['PSE', 'Tarjeta', 'Nequi', 'Bancolombia'], default: 'PSE' })
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'ESTÁNDAR COMERCIAL (MP3 HQ)', default: 'ESTÁNDAR COMERCIAL (MP3 HQ)' })
  licenseType?: string;

  @ApiPropertyOptional({ example: 29.99, description: 'Monto total pagado en USD' })
  amount?: number;

  @ApiPropertyOptional({ example: 'Carlos Mendoza', description: 'Nombre del pagador' })
  payerName?: string;

  @ApiPropertyOptional({ example: 'carlos@oziris.test', description: 'Correo del pagador' })
  payerEmail?: string;

  @ApiPropertyOptional({ example: '+57 300 1234567', description: 'Teléfono de contacto' })
  payerPhone?: string;

  @ApiPropertyOptional({ example: '1020304050', description: 'Documento de identidad' })
  payerDocument?: string;

  @ApiPropertyOptional({ example: 'Bancolombia', description: 'Banco emisor (método PSE)' })
  bankName?: string;

  @ApiPropertyOptional({ example: 'Persona natural', enum: ['Persona natural', 'Persona jurídica'] })
  personType?: string;

  @ApiPropertyOptional({ example: 'Carlos Mendoza', description: 'Nombre en la tarjeta' })
  cardHolder?: string;

  @ApiPropertyOptional({ example: '4242', description: 'Últimos 4 dígitos de tarjeta' })
  cardLastFour?: string;

  @ApiPropertyOptional({ example: '3001234567', description: 'Número telefónico billetera virtual' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Metadatos complementarios' })
  metadata?: any;
}
