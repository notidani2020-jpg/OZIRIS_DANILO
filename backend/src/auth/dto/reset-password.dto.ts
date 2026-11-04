import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'usuario1@oziris.test', description: 'Correo registrado' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Código numérico de 6 dígitos' })
  code: string;

  @ApiProperty({ example: 'NuevaClaveSegura123!', description: 'Nueva contraseña (mínimo 6 caracteres)' })
  newPassword: string;
}
