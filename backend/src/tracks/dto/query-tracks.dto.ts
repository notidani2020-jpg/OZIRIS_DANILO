import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTracksDto {
  @ApiPropertyOptional({ example: 'Trap', description: 'Filtrar por género musical' })
  genre?: string;

  @ApiPropertyOptional({ example: 'dark', description: 'Buscar por título, descripción o tags' })
  search?: string;

  @ApiPropertyOptional({ example: 'melodic', description: 'Filtrar por tag específico' })
  tag?: string;

  @ApiPropertyOptional({ example: 50, description: 'Precio máximo en USD' })
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'beats', description: 'Categoría del track' })
  category?: string;

  @ApiPropertyOptional({
    example: 'price_asc',
    enum: ['price_asc', 'price_desc', 'newest', 'popular'],
    description: 'Criterio de ordenamiento',
  })
  sort?: string;
}
