import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'usuario1@oziris.test', description: 'Correo registrado' })
  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Código numérico de 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos.' })
  code: string;

  @ApiProperty({ example: 'NuevaClaveSegura123!', description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @MaxLength(128)
  newPassword: string;
}
