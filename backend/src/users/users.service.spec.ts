import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(10),
      },
      track: {
        count: jest.fn().mockResolvedValue(25),
      },
      purchase: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 1500 } }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(5),
      },
      favorite: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      artist: {
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('debe retornar usuarios sanitizados sin exponer el hash de contraseña', async () => {
      const mockDbUsers = [
        {
          id: 'u-1',
          name: 'Santiago',
          email: 'santiago@mail.com',
          password: 'hashed-secret-password',
          role: 'ADMIN',
          isActive: true,
          artist: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaService.user.findMany.mockResolvedValue(mockDbUsers);

      const users = await service.findAll();
      expect(users).toHaveLength(1);
      expect((users[0] as any).password).toBeUndefined();
      expect(users[0].email).toBe('santiago@mail.com');
    });
  });

  describe('findById', () => {
    it('debe retornar el usuario sanitizado si existe', async () => {
      const mockUser = {
        id: 'u-100',
        name: 'Laura',
        email: 'laura@mail.com',
        password: 'super-secret-hash',
        role: 'USER',
        isActive: true,
        artist: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const user = await service.findById('u-100');
      expect(user.id).toBe('u-100');
      expect(user.name).toBe('Laura');
      expect((user as any).password).toBeUndefined();
    });

    it('debe arrojar NotFoundException si el usuario no existe', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent-user-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createUser', () => {
    it('debe crear un usuario nuevo con contraseña encriptada', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: data.id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          artist: null,
        });
      });

      const newUser = await service.createUser({
        name: 'Juan Perez',
        email: 'juan@mail.com',
        password: 'plainPassword123',
        role: 'USER',
      });

      expect(newUser.id).toMatch(/^user-/);
      expect(newUser.email).toBe('juan@mail.com');
      expect((newUser as any).password).toBeUndefined();
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('debe arrojar ConflictException si el email ya se encuentra registrado', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'juan@mail.com',
      });

      await expect(
        service.createUser({
          name: 'Juan Perez',
          email: 'juan@mail.com',
          password: 'plainPassword123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getAdminStats', () => {
    it('debe compilar las estadísticas globales del sistema', async () => {
      const stats = await service.getAdminStats();
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('totalTracks');
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats.totalRevenue).toBe(359.88);
    });
  });
});
