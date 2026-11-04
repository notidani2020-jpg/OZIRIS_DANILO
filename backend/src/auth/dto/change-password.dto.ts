import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'ClaveActual123!', description: 'Contraseña actual' })
  @IsString()
  @MaxLength(128)
  currentPassword: string;

  @ApiProperty({ example: 'NuevaClave456!', description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' })
  @MaxLength(128)
  newPassword: string;
}
