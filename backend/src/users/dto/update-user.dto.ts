import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Carlos', description: 'Nombre del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'López', description: 'Apellido del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'DJ Karlo', description: 'Nombre artístico (para productores)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  artistName?: string;

  @ApiPropertyOptional({ example: 'Bogotá, Colombia', description: 'Ciudad o país del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiPropertyOptional({ example: 'Productor de trap y reggaeton desde 2018.', description: 'Biografía corta' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: '/uploads/avatar-abc123.png', description: 'URL de la foto de perfil' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  avatarUrl?: string;
  @ApiPropertyOptional({ example: 'Trap', description: 'Género principal del artista' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  genre?: string;

  @ApiPropertyOptional({ example: '/uploads/banner-abc123.png', description: 'URL del banner del artista' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'https://open.spotify.com/artist/...', description: 'Enlace de Spotify' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'URL inválida.' })
  @MaxLength(300)
  spotifyUrl?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/usuario', description: 'Enlace de Instagram' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'URL inválida.' })
  @MaxLength(300)
  instagramUrl?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/@usuario', description: 'Enlace de YouTube' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'URL inválida.' })
  @MaxLength(300)
  youtubeUrl?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Carlos', description: 'Nombre del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'López' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'DJ Karlo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  artistName?: string;

  @ApiPropertyOptional({ example: 'Medellín, Colombia' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiPropertyOptional({ example: 'PRODUCER', enum: ['USER', 'ADMIN', 'PRODUCER'], description: 'Rol del usuario' })
  @IsOptional()
  @IsIn(['USER', 'ADMIN', 'PRODUCER'])
  role?: string;

  @ApiPropertyOptional({ example: true, description: 'Estado activo/inactivo de la cuenta' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, description: '[ADMIN] Marcar al artista como verificado' })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ example: 'Productor de trap.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: '/uploads/avatar-xyz.png' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  avatarUrl?: string;
}
