import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Santiago Díaz', description: 'Nombre completo del usuario' })
  name: string;

  @ApiProperty({ example: 'santiago@oziris.test', description: 'Correo electrónico' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña (mínimo 6 caracteres)' })
  password: string;

  @ApiPropertyOptional({ enum: ['USER', 'ARTIST'], default: 'USER', description: 'Tipo de cuenta' })
  accountType?: 'USER' | 'ARTIST';

  @ApiPropertyOptional({ example: 'SantiBeats', description: 'Nombre artístico (si es ARTIST)' })
  artisticName?: string;

  @ApiPropertyOptional({ example: 'Trap / Drill', description: 'Género musical principal' })
  genre?: string;
}
