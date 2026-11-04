import { IsEmail, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@oziris.test', description: 'Correo electrónico registrado' })
  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  email: string;

  @ApiProperty({ example: 'AdminOziris123!', description: 'Contraseña de acceso' })
  @IsString()
  @MaxLength(128)
  password: string;
}
