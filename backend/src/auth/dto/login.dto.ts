import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@oziris.test', description: 'Correo electrónico registrado' })
  email: string;

  @ApiProperty({ example: 'AdminOziris123!', description: 'Contraseña de acceso' })
  password: string;
}
