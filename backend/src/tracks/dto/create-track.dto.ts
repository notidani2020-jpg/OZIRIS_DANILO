import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTrackDto {
  @ApiProperty({ example: 'Nightfall Trap Beat', description: 'Título de la pista' })
  title: string;

  @ApiPropertyOptional({ example: 'Beat instrumental con bajos 808 profundos y melodías oscuras.', description: 'Descripción' })
  description?: string;

  @ApiPropertyOptional({ example: 29.99, description: 'Precio en USD', default: 29.99 })
  price?: number;

  @ApiPropertyOptional({ example: 'Trap', description: 'Género musical' })
  genre?: string;

  @ApiPropertyOptional({ example: 140, description: 'Tempo en BPM', default: 120 })
  bpm?: number;

  @ApiPropertyOptional({ example: 'C Minor', description: 'Tonalidad musical' })
  key?: string;

  @ApiPropertyOptional({ example: ['Trap', 'Dark', '808'], description: 'Etiquetas / Tags' })
  tags?: string[];

  @ApiPropertyOptional({ example: '/uploads/beat-audio.mp3', description: 'URL de vista previa del audio' })
  audioUrl?: string;

  @ApiPropertyOptional({ example: '/uploads/beat-full.mp3', description: 'URL del audio master completo' })
  fullAudioUrl?: string;

  @ApiPropertyOptional({ example: '/uploads/beat-cover.jpg', description: 'URL de la carátula' })
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'user-admin-1', description: 'ID del productor' })
  producerId?: string;
}
