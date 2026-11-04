import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario1@oziris.test', description: 'Correo registrado para enviar código de 6 dígitos' })
  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  email: string;
}
