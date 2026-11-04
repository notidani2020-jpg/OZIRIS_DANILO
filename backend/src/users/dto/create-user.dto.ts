import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Carlos López', description: 'Nombre completo del usuario' })
  name: string;

  @ApiProperty({ example: 'carlos@oziris.test', description: 'Correo electrónico único' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña (mín. 6 caracteres)' })
  password: string;

  @ApiPropertyOptional({
    example: 'USER',
    enum: ['USER', 'ADMIN', 'PRODUCER'],
    description: 'Rol asignado al usuario (por defecto USER)',
  })
  role?: string;
}
