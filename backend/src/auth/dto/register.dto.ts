import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Santiago Díaz', description: 'Nombre completo del usuario' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'santiago@oziris.test', description: 'Correo electrónico' })
  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ enum: ['USER', 'ARTIST'], default: 'USER', description: 'Tipo de cuenta' })
  @IsOptional()
  @IsIn(['USER', 'ARTIST'])
  accountType?: 'USER' | 'ARTIST';

  @ApiPropertyOptional({ example: 'SantiBeats', description: 'Nombre artístico (si es ARTIST)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  artisticName?: string;

  @ApiPropertyOptional({ example: 'Trap / Drill', description: 'Género musical principal' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  genre?: string;
}
