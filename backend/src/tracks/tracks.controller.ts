import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorageWithPrefix, trackFileFilter, MB } from '../common/upload.utils';
import { unlink } from 'fs';
import { TracksService } from './tracks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Track, UpdateTrackDto } from './dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Tracks')
@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar y filtrar beats', description: 'Devuelve todos los beats con soporte de filtros opcionales.' })
  @ApiQuery({ name: 'genre', required: false, example: 'Trap', description: 'Filtrar por género' })
  @ApiQuery({ name: 'search', required: false, example: 'dark', description: 'Búsqueda por texto (título, descripción, tags)' })
  @ApiQuery({ name: 'tag', required: false, example: 'melodic', description: 'Filtrar por tag' })
  @ApiQuery({ name: 'maxPrice', required: false, example: 50, description: 'Precio máximo en USD' })
  @ApiQuery({ name: 'category', required: false, example: 'beats', description: 'Filtrar por categoría' })
  @ApiQuery({ name: 'producerId', required: false, description: 'Filtrar por ID del productor' })
  @ApiQuery({ name: 'sort', required: false, enum: ['price_asc', 'price_desc', 'newest', 'popular'], description: 'Criterio de ordenamiento' })
  @ApiResponse({ status: 200, description: 'Lista de tracks.' })
  async findAll(
    @Query('genre') genre?: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    @Query('producerId') producerId?: string,
  ): Promise<Track[]> {
    return this.tracksService.findAll({
      genre,
      search,
      tag,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      category,
      sort,
      producerId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un beat por ID' })
  @ApiParam({ name: 'id', description: 'ID del track' })
  @ApiResponse({ status: 200, description: 'Datos del track.' })
  @ApiResponse({ status: 404, description: 'Track no encontrado.' })
  async findOne(@Param('id') id: string): Promise<Track> {
    return this.tracksService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRODUCER', 'ADMIN')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Subir un nuevo beat',
    description: 'Requiere autenticación JWT. Enviar como `multipart/form-data` con los archivos de audio y portada.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'price'],
      properties: {
        title:       { type: 'string',  example: 'Dark Night Trap',          description: 'Título del beat' },
        description: { type: 'string',  example: 'Beat oscuro con 808s',      description: 'Descripción' },
        price:       { type: 'number',  example: 29.99,                       description: 'Precio en USD' },
        genre:       { type: 'string',  example: 'Trap',                      description: 'Género musical' },
        bpm:         { type: 'integer', example: 140,                         description: 'Beats por minuto' },
        key:         { type: 'string',  example: 'Am',                        description: 'Tonalidad' },
        tags:        { type: 'string',  example: 'dark,808,melodic',          description: 'Tags separados por coma' },
        audio:       { type: 'string',  format: 'binary',                     description: 'Archivo de audio (MP3/WAV)' },
        cover:       { type: 'string',  format: 'binary',                     description: 'Imagen de portada (JPG/PNG)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Beat creado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'audio', maxCount: 1 },
        { name: 'audioFile', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
      ],
      {
        storage: diskStorageWithPrefix(),
        fileFilter: trackFileFilter,
        limits: { fileSize: 100 * MB, files: 4 },
      },
    ),
  )
  async create(
    @Request() req: any,
    @Body() body: any,
    @UploadedFiles()
    files: {
      audio?: any[];
      audioFile?: any[];
      cover?: any[];
      coverImage?: any[];
    },
  ): Promise<Track> {
    const uploadedAudio = files?.audioFile?.[0] || files?.audio?.[0];
    const uploadedCover = files?.coverImage?.[0] || files?.cover?.[0];

    const allFiles = [
      ...(files?.audio ?? []),
      ...(files?.audioFile ?? []),
      ...(files?.cover ?? []),
      ...(files?.coverImage ?? []),
    ];
    const discardUploads = () =>
      allFiles.forEach((f) => unlink(f.path, () => undefined));

    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title || title.length > 150) {
      discardUploads();
      throw new BadRequestException('El título es obligatorio (máx. 150 caracteres).');
    }
    const parsedPrice = body?.price !== undefined && body?.price !== '' ? Number(body.price) : 29.99;
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 100000) {
      discardUploads();
      throw new BadRequestException('El precio no es válido.');
    }

    const audioUrl = uploadedAudio
      ? `/uploads/${uploadedAudio.filename}`
      : body?.audioUrl || '';
    const coverUrl = uploadedCover
      ? `/uploads/${uploadedCover.filename}`
      : body?.coverUrl || '';

    const tagsArray =
      typeof body?.tags === 'string'
        ? body.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : body?.tags || [];

    // ID del productor tomado SIEMPRE del usuario autenticado via JWT
    const producerId = req.user.id;

    return this.tracksService.create({
      title,
      description: body?.description,
      price: parsedPrice,
      genre: body?.genre,
      bpm: body?.bpm ? parseInt(body.bpm) : 120,
      key: body?.key,
      tags: tagsArray,
      audioUrl,
      fullAudioUrl: audioUrl,
      coverUrl,
      producerId,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Editar un beat (dueño o ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID del track a editar' })
  @ApiResponse({ status: 200, description: 'Beat actualizado.' })
  @ApiResponse({ status: 403, description: 'Solo el dueño del beat o un ADMIN pueden editarlo.' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateTrackDto,
  ): Promise<Track> {
    const track = await this.tracksService.findOne(id);
    if (req.user.role !== 'ADMIN' && track.producerId !== req.user.id) {
      throw new ForbiddenException('No puedes editar un beat que no es tuyo.');
    }
    return this.tracksService.update(id, body);
  }

  @Post(':id/play')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Registrar una reproducción del beat' })
  @ApiParam({ name: 'id', description: 'ID del track reproducido' })
  async registerPlay(@Param('id') id: string): Promise<{ playsCount: number }> {
    return this.tracksService.registerPlay(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Eliminar un beat por ID' })
  @ApiParam({ name: 'id', description: 'ID del track a eliminar' })
  @ApiResponse({ status: 200, description: 'Beat eliminado.' })
  @ApiResponse({ status: 404, description: 'Beat no encontrado.' })
  @ApiResponse({ status: 403, description: 'Solo el dueño del beat o un ADMIN pueden eliminarlo.' })
  async remove(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const track = await this.tracksService.findOne(id);
    if (req.user.role !== 'ADMIN' && track.producerId !== req.user.id) {
      throw new ForbiddenException('No puedes eliminar un beat que no es tuyo.');
    }
    return this.tracksService.remove(id);
  }
}
