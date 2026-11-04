import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(data: {
    name: string;
    email: string;
    password: string;
    accountType?: 'USER' | 'ARTIST';
    artisticName?: string;
    genre?: string;
  }) {
    if (!data.name || !data.email || !data.password) {
      throw new BadRequestException('Todos los campos son obligatorios.');
    }

    if (data.password.length < 6) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 6 caracteres.',
      );
    }

    const isArtist = data.accountType === 'ARTIST';
    const assignedRole = isArtist ? 'PRODUCER' : 'USER';

    const newUser = await this.usersService.createUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: assignedRole,
      artisticName: isArtist
        ? data.artisticName?.trim() || data.name.trim()
        : undefined,
      genre: isArtist ? data.genre?.trim() : undefined,
    });

    const token = this.generateToken(newUser.id, newUser.email, newUser.role);

    return {
      message: isArtist
        ? '¡Cuenta de Artista creada exitosamente!'
        : '¡Usuario registrado exitosamente!',
      access_token: token,
      user: newUser,
    };
  }

  async login(data: { email: string; password: string }) {
    if (!data.email || !data.password) {
      throw new BadRequestException('Por favor ingrese correo y contraseña.');
    }

    const user = await this.usersService.findByEmailWithPassword(data.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    if (user.isActive === false) {
      throw new ForbiddenException(
        'Esta cuenta se encuentra desactivada. Contacte al administrador.',
      );
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const token = this.generateToken(user.id, user.email, user.role);
    const fullUser = await this.usersService.findById(user.id);

    return {
      message: 'Inicio de sesión exitoso.',
      access_token: token,
      user: fullUser,
    };
  }

  async getProfile(userId: string) {
    return this.usersService.findById(userId);
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  async forgotPassword(email: string, ipAddress?: string) {
    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail) {
      throw new BadRequestException('Debes ingresar un correo electrónico.');
    }

    const user = await this.usersService.findByEmailWithPassword(cleanEmail);
    if (!user) {
      // Protect user privacy by returning generic success message
      return {
        message:
          'Si el correo está registrado en Oziris, recibirás un código de recuperación.',
      };
    }

    // Invalidate any existing unused reset codes for this email
    try {
      await this.prisma.passwordReset.updateMany({
        where: {
          email: cleanEmail,
          used: false,
        },
        data: {
          used: true,
        },
      });
    } catch (e) {
      // Ignore if table query fails
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    try {
      await this.prisma.passwordReset.create({
        data: {
          email: cleanEmail,
          code,
          expiresAt,
          userId: user.id,
          attempts: 0,
          used: false,
          ipAddress: ipAddress || null,
        },
      });

      // Keep user columns in sync for backward compatibility
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordCode: code,
          resetPasswordExpires: expiresAt,
        },
      });
    } catch (e) {
      // In-memory fallback
      user.resetPasswordCode = code;
      user.resetPasswordExpires = expiresAt;
    }

    await this.mailService.sendPasswordResetEmail(user.email, code);
    return {
      message:
        'Si el correo está registrado en Oziris, recibirás un código de recuperación.',
      email: cleanEmail,
    };
  }

  async verifyResetCode(email: string, code: string) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanCode = code?.trim();

    if (!cleanEmail || !cleanCode) {
      throw new BadRequestException('Por favor proporciona correo y código.');
    }

    // First check in dedicated PasswordReset table
    let resetRecord: any = null;
    try {
      resetRecord = await this.prisma.passwordReset.findFirst({
        where: {
          email: cleanEmail,
          used: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (e) {
      // Fallback
    }

    if (!resetRecord) {
      // Fallback to User table if not found in PasswordReset table
      const user = await this.usersService.findByEmailWithPassword(cleanEmail);
      if (!user || !user.resetPasswordCode || !user.resetPasswordExpires) {
        throw new BadRequestException(
          'Código inválido o ya utilizado. Solicita uno nuevo.',
        );
      }
      if (user.resetPasswordCode !== cleanCode) {
        throw new BadRequestException('El código ingresado es incorrecto.');
      }
      if (new Date() > new Date(user.resetPasswordExpires)) {
        throw new BadRequestException(
          'El código ha expirado (validez de 15 minutos). Por favor solicita uno nuevo.',
        );
      }
      return { message: 'Código verificado con éxito.' };
    }

    // Check expiration
    if (new Date() > new Date(resetRecord.expiresAt)) {
      try {
        await this.prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { used: true },
        });
      } catch (_) {}
      throw new BadRequestException(
        'El código ha expirado (validez de 15 minutos). Por favor solicita uno nuevo.',
      );
    }

    // Check brute force attempts (max 5 failed attempts)
    if (resetRecord.attempts >= 5) {
      try {
        await this.prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { used: true },
        });
      } catch (_) {}
      throw new BadRequestException(
        'Has superado el número máximo de intentos permitidos. Solicita un nuevo código por seguridad.',
      );
    }

    // Validate code match
    if (resetRecord.code !== cleanCode) {
      const nextAttempts = resetRecord.attempts + 1;
      try {
        await this.prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: {
            attempts: nextAttempts,
            used: nextAttempts >= 5,
          },
        });
      } catch (_) {}

      const remaining = 5 - nextAttempts;
      if (remaining <= 0) {
        throw new BadRequestException(
          'Código incorrecto. Has agotado tus intentos. Por seguridad solicita un nuevo código.',
        );
      }
      throw new BadRequestException(
        `El código ingresado es incorrecto. Te ${remaining === 1 ? 'queda 1 intento' : `quedan ${remaining} intentos`}.`,
      );
    }

    return { message: 'Código verificado con éxito.' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanCode = code?.trim();

    if (!cleanEmail || !cleanCode || !newPassword) {
      throw new BadRequestException('Todos los campos son obligatorios.');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException(
        'La nueva contraseña debe tener al menos 6 caracteres.',
      );
    }

    const user = await this.usersService.findByEmailWithPassword(cleanEmail);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    // Validate with PasswordReset record
    let resetRecord: any = null;
    try {
      resetRecord = await this.prisma.passwordReset.findFirst({
        where: {
          email: cleanEmail,
          used: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (_) {}

    if (resetRecord) {
      if (new Date() > new Date(resetRecord.expiresAt)) {
        try {
          await this.prisma.passwordReset.update({
            where: { id: resetRecord.id },
            data: { used: true },
          });
        } catch (_) {}
        throw new BadRequestException(
          'El código ha expirado. Solicita un nuevo código.',
        );
      }

      if (resetRecord.attempts >= 5 || resetRecord.code !== cleanCode) {
        throw new BadRequestException('Código incorrecto o no autorizado.');
      }
    } else {
      // Fallback to User table
      if (!user.resetPasswordCode || !user.resetPasswordExpires) {
        throw new BadRequestException('Código inválido o expirado.');
      }
      if (user.resetPasswordCode !== cleanCode) {
        throw new BadRequestException('Código incorrecto.');
      }
      if (new Date() > new Date(user.resetPasswordExpires)) {
        throw new BadRequestException(
          'El código ha expirado. Solicita un nuevo código.',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordCode: null,
          resetPasswordExpires: null,
        },
      });

      if (resetRecord) {
        await this.prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: {
            used: true,
            usedAt: new Date(),
          },
        });
      }
    } catch (e) {
      user.password = hashedPassword;
      user.resetPasswordCode = null;
      user.resetPasswordExpires = null;
    }

    return {
      message:
        'Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.',
    };
  }
}
