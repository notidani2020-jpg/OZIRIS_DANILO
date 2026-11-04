import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Carlos', description: 'Nombre del usuario' })
  name?: string;

  @ApiPropertyOptional({ example: 'López', description: 'Apellido del usuario' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'DJ Karlo', description: 'Nombre artístico (para productores)' })
  artistName?: string;

  @ApiPropertyOptional({ example: 'Bogotá, Colombia', description: 'Ciudad o país del usuario' })
  location?: string;

  @ApiPropertyOptional({ example: 'Productor de trap y reggaeton desde 2018.', description: 'Biografía corta' })
  bio?: string;

  @ApiPropertyOptional({ example: '/uploads/avatar-abc123.png', description: 'URL de la foto de perfil' })
  avatarUrl?: string;
  @ApiPropertyOptional({ example: 'Trap', description: 'Género principal del artista' })
  genre?: string;

  @ApiPropertyOptional({ example: '/uploads/banner-abc123.png', description: 'URL del banner del artista' })
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'https://open.spotify.com/artist/...', description: 'Enlace de Spotify' })
  spotifyUrl?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/usuario', description: 'Enlace de Instagram' })
  instagramUrl?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/@usuario', description: 'Enlace de YouTube' })
  youtubeUrl?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Carlos', description: 'Nombre del usuario' })
  name?: string;

  @ApiPropertyOptional({ example: 'López' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'DJ Karlo' })
  artistName?: string;

  @ApiPropertyOptional({ example: 'Medellín, Colombia' })
  location?: string;

  @ApiPropertyOptional({ example: 'PRODUCER', enum: ['USER', 'ADMIN', 'PRODUCER'], description: 'Rol del usuario' })
  role?: string;

  @ApiPropertyOptional({ example: true, description: 'Estado activo/inactivo de la cuenta' })
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Productor de trap.' })
  bio?: string;

  @ApiPropertyOptional({ example: '/uploads/avatar-xyz.png' })
  avatarUrl?: string;
}
