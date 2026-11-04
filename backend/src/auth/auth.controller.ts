import { Throttle } from '@nestjs/throttler';
import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario', description: 'Crea una cuenta nueva y devuelve un token JWT.' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente — devuelve access_token.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o email ya registrado.' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica al usuario y devuelve un token JWT.' })
  @ApiResponse({ status: 200, description: 'Login exitoso — devuelve access_token.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas.' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado', description: 'Requiere JWT válido.' })
  @ApiResponse({ status: 200, description: 'Datos del usuario autenticado.' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado.' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar código de recuperación de contraseña', description: 'Envía un código de 6 dígitos al email registrado.' })
  @ApiResponse({ status: 200, description: 'Correo de recuperación enviado (o mensaje de seguridad).' })
  async forgotPassword(@Body() body: ForgotPasswordDto, @Request() req: any) {
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || null;
    return this.authService.forgotPassword(body.email, ip);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código de recuperación', description: 'Valida el código de 6 dígitos enviado al email.' })
  @ApiResponse({ status: 200, description: 'Código válido.' })
  @ApiResponse({ status: 400, description: 'Código inválido o expirado.' })
  async verifyResetCode(@Body() body: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(body.email, body.code);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña', description: 'Establece una nueva contraseña usando el código verificado.' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Código inválido, expirado o contraseña no cumple requisitos.' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Cambiar contraseña (sesión iniciada)', description: 'Requiere la contraseña actual.' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada.' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta o nueva inválida.' })
  async changePassword(@Request() req: any, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.id,
      req.user.email,
      body.currentPassword,
      body.newPassword,
    );
  }
}
