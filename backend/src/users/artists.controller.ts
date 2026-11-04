import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

/** Perfil público de artistas (no requiere sesión, no expone datos privados). */
@ApiTags('Artists')
@Controller('artists')
export class ArtistsController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Perfil público de un artista/productor' })
  @ApiParam({ name: 'id', description: 'ID del usuario productor' })
  @ApiResponse({ status: 200, description: 'Datos públicos del artista y sus estadísticas.' })
  @ApiResponse({ status: 404, description: 'Artista no encontrado.' })
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicArtist(id);
  }
}
