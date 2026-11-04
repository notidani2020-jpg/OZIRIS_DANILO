import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorageWithPrefix, imageFileFilter, MB } from '../common/upload.utils';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-Auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // USER PROFILE ENDPOINTS
  @Patch('profile')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado correctamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Post('profile/avatar')
  @ApiOperation({ summary: 'Subir foto de perfil (avatar)', description: 'Enviar como multipart/form-data con el campo "avatar".' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary', description: 'Imagen JPG, PNG o WEBP' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Avatar subido y perfil actualizado.' })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorageWithPrefix('avatar-'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * MB, files: 1 },
    }),
  )
  async uploadAvatar(@Request() req: any, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Debes adjuntar una imagen.');
    const avatarUrl = `/uploads/${file.filename}`;
    return this.usersService.updateProfile(req.user.id, { avatarUrl });
  }

  @Post('profile/banner')
  @ApiOperation({ summary: 'Subir banner del artista', description: 'Enviar como multipart/form-data con el campo "banner".' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        banner: { type: 'string', format: 'binary', description: 'Imagen JPG, PNG o WEBP' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Banner subido y perfil actualizado.' })
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorageWithPrefix('banner-'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * MB, files: 1 },
    }),
  )
  async uploadBanner(@Request() req: any, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Debes adjuntar una imagen.');
    const bannerUrl = `/uploads/${file.filename}`;
    return this.usersService.updateProfile(req.user.id, { bannerUrl });
  }

  // FAVORITES ENDPOINTS
  @Get('favorites')
  @ApiOperation({ summary: 'Obtener beats favoritos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de tracks marcados como favoritos.' })
  async getFavorites(@Request() req: any) {
    return this.usersService.getUserFavorites(req.user.id);
  }

  @Post('favorites/:trackId')
  @ApiOperation({ summary: 'Agregar/quitar un beat de favoritos (toggle)' })
  @ApiParam({ name: 'trackId', description: 'ID del track a marcar/desmarcar' })
  @ApiResponse({ status: 201, description: 'Estado de favorito actualizado.' })
  async toggleFavorite(@Request() req: any, @Param('trackId') trackId: string) {
    return this.usersService.toggleFavorite(req.user.id, trackId);
  }

  // ADMIN ENDPOINTS
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Obtener estadísticas generales del sistema' })
  @ApiResponse({ status: 200, description: 'Estadísticas de usuarios, tracks y ventas.' })
  @ApiResponse({ status: 403, description: 'Solo accesible por usuarios con rol ADMIN.' })
  async getAdminStats() {
    return this.usersService.getAdminStats();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Listar todos los usuarios' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre o email' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios.' })
  @ApiResponse({ status: 403, description: 'Solo accesible por ADMIN.' })
  async findAll(@Query('search') search?: string) {
    return this.usersService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Datos del usuario.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      throw new ForbiddenException('No tienes permiso para ver este usuario.');
    }
    return this.usersService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado.' })
  @ApiResponse({ status: 403, description: 'Solo accesible por ADMIN.' })
  async create(@Body() body: CreateUserDto) {
    return this.usersService.createUser(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Actualizar datos de un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario a actualizar' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado.' })
  @ApiResponse({ status: 403, description: 'Solo accesible por ADMIN.' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    if (
      req.user.id === id &&
      ((body.role !== undefined && body.role !== 'ADMIN') ||
        body.isActive === false)
    ) {
      throw new ForbiddenException(
        'No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.',
      );
    }
    return this.usersService.updateUser(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Eliminar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario a eliminar' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado.' })
  @ApiResponse({ status: 403, description: 'Solo accesible por ADMIN.' })
  async remove(@Request() req: any, @Param('id') id: string) {
    if (req.user.id === id) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta.');
    }
    return this.usersService.deleteUser(id);
  }
}
