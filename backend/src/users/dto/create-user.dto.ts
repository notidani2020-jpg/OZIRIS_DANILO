import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Carlos López', description: 'Nombre completo del usuario' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'carlos@oziris.test', description: 'Correo electrónico único' })
  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña (mín. 6 caracteres)' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({
    example: 'USER',
    enum: ['USER', 'ADMIN', 'PRODUCER'],
    description: 'Rol asignado al usuario (por defecto USER)',
  })
  @IsOptional()
  @IsIn(['USER', 'ADMIN', 'PRODUCER'])
  role?: string;
}
