import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TracksService } from './tracks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Track } from './dto';

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
  @ApiQuery({ name: 'sort', required: false, enum: ['price_asc', 'price_desc', 'newest', 'popular'], description: 'Criterio de ordenamiento' })
  @ApiResponse({ status: 200, description: 'Lista de tracks.' })
  async findAll(
    @Query('genre') genre?: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
  ): Promise<Track[]> {
    return this.tracksService.findAll({
      genre,
      search,
      tag,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      category,
      sort,
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
  @UseGuards(JwtAuthGuard)
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
        storage: diskStorage({
          destination: './uploads',
          filename: (
            req: any,
            file: any,
            cb: (error: Error | null, filename: string) => void,
          ) => {
            const randomName = Array(16)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
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
      title: body?.title,
      description: body?.description,
      price: body?.price ? parseFloat(body.price) : 29.99,
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

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un beat por ID' })
  @ApiParam({ name: 'id', description: 'ID del track a eliminar' })
  @ApiResponse({ status: 200, description: 'Beat eliminado.' })
  @ApiResponse({ status: 404, description: 'Beat no encontrado.' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.tracksService.remove(id);
  }
}
