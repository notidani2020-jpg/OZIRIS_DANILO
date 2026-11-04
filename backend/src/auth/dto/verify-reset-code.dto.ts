import { IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetCodeDto {
  @ApiProperty({ example: 'usuario1@oziris.test', description: 'Correo registrado' })
  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Código numérico de 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos.' })
  code: string;
}
