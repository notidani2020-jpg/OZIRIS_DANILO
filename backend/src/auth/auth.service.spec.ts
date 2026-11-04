import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let mailService: Partial<Record<keyof MailService, jest.Mock>>;
  let prismaService: any;

  beforeEach(async () => {
    usersService = {
      createUser: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    mailService = {
      sendPasswordResetEmail: jest
        .fn()
        .mockResolvedValue({ success: true, message: 'sent' }),
    };

    prismaService = {
      passwordReset: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: 'reset-1' }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('debe arrojar BadRequestException si faltan campos obligatorios', async () => {
      await expect(
        authService.register({
          name: '',
          email: 'test@mail.com',
          password: '123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe arrojar BadRequestException si la contraseña tiene menos de 6 caracteres', async () => {
      await expect(
        authService.register({
          name: 'Test',
          email: 'test@mail.com',
          password: '123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe registrar un usuario regular con rol USER', async () => {
      const mockCreatedUser = {
        id: 'u-1',
        name: 'Carlos',
        email: 'carlos@mail.com',
        role: 'USER',
      };
      (usersService.createUser as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await authService.register({
        name: 'Carlos',
        email: 'carlos@mail.com',
        password: 'password123',
        accountType: 'USER',
      });

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result.user).toEqual(mockCreatedUser);
      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'USER' }),
      );
    });

    it('debe registrar un artista con rol PRODUCER', async () => {
      const mockArtistUser = {
        id: 'u-2',
        name: 'Beatmaker Pro',
        email: 'artist@mail.com',
        role: 'PRODUCER',
      };
      (usersService.createUser as jest.Mock).mockResolvedValue(mockArtistUser);

      const result = await authService.register({
        name: 'Beatmaker Pro',
        email: 'artist@mail.com',
        password: 'password123',
        accountType: 'ARTIST',
        artisticName: 'Pro Beats',
        genre: 'Trap',
      });

      expect(result.message).toContain('Cuenta de Artista creada exitosamente');
      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'PRODUCER',
          artisticName: 'Pro Beats',
        }),
      );
    });
  });

  describe('login', () => {
    it('debe arrojar BadRequestException si no se envía email o password', async () => {
      await expect(
        authService.login({ email: '', password: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe arrojar UnauthorizedException si el usuario no existe', async () => {
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        authService.login({
          email: 'noexiste@mail.com',
          password: '123456password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe arrojar ForbiddenException si la cuenta está inactiva', async () => {
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue({
        id: 'u-inactive',
        email: 'inactive@mail.com',
        password: 'hashed',
        isActive: false,
      });

      await expect(
        authService.login({
          email: 'inactive@mail.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe arrojar UnauthorizedException si la contraseña no coincide', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue({
        id: 'u-active',
        email: 'active@mail.com',
        password: hashedPassword,
        isActive: true,
        role: 'USER',
      });

      await expect(
        authService.login({
          email: 'active@mail.com',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe retornar access_token y datos de usuario si credenciales son correctas', async () => {
      const plainPassword = 'correctPassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const user = {
        id: 'u-valid',
        email: 'valid@mail.com',
        password: hashedPassword,
        isActive: true,
        role: 'USER',
      };
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        user,
      );
      (usersService.findById as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
      });

      const result = await authService.login({
        email: 'valid@mail.com',
        password: plainPassword,
      });

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result.message).toBe('Inicio de sesión exitoso.');
    });
  });

  describe('forgotPassword', () => {
    it('debe arrojar BadRequestException si el email está vacío', async () => {
      await expect(authService.forgotPassword('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe retornar mensaje de protección de privacidad si el usuario no existe', async () => {
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await authService.forgotPassword('unknown@mail.com');
      expect(result.message).toContain(
        'Si el correo está registrado en Oziris',
      );
    });

    it('debe generar código y llamar a mailService si el usuario existe', async () => {
      (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue({
        id: 'u-1',
        email: 'user@mail.com',
      });

      const result = await authService.forgotPassword('user@mail.com');
      expect(result).toHaveProperty('email', 'user@mail.com');
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });
});
