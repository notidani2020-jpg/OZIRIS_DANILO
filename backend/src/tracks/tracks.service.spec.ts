import { Test, TestingModule } from '@nestjs/testing';
import { TracksService } from './tracks.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TracksService', () => {
  let service: TracksService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      track: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracksService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<TracksService>(TracksService);
  });

  describe('findAll', () => {
    it('debe retornar lista de pistas desde base de datos si está disponible', async () => {
      const mockTracks = [
        {
          id: 't-1',
          title: 'Nightfall Trap',
          price: 29.99,
          genre: 'Trap',
          tags: ['dark', '808'],
          audioUrl: '/uploads/track1.mp3',
          producer: { name: 'Producer 1', artistName: 'ProdOne' },
        },
      ];
      prismaService.track.findMany.mockResolvedValue(mockTracks);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Nightfall Trap');
    });

    it('debe usar fallback en memoria si la base de datos falla', async () => {
      prismaService.track.findMany.mockRejectedValue(
        new Error('DB Connection Failed'),
      );

      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('debe filtrar en memoria por género correctamente', async () => {
      prismaService.track.findMany.mockRejectedValue(
        new Error('DB Connection Failed'),
      );

      const result = await service.findAll({ genre: 'Trap' });
      result.forEach((t) => {
        expect(t.genre?.toLowerCase()).toBe('trap');
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar una pista por su ID si existe', async () => {
      const mockTrack = {
        id: 't-find-1',
        title: 'Deep House Beats',
        price: 25.0,
        audioUrl: '/audio.mp3',
      };
      prismaService.track.findUnique.mockResolvedValue(mockTrack);

      const result = await service.findOne('t-find-1');
      expect(result.title).toBe('Deep House Beats');
    });

    it('debe arrojar NotFoundException si la pista no existe ni en DB ni en fallback', async () => {
      prismaService.track.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('id-totalmente-inexistente-12345'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe crear una pista con los campos obligatorios y valores por defecto', async () => {
      const newTrackData = {
        title: 'Cyberpunk Synth',
        price: 35.0,
        audioUrl: '/uploads/synth.mp3',
        coverUrl: '/uploads/synth.jpg',
        producerId: 'prod-uuid-1',
      };

      prismaService.track.create.mockResolvedValue({
        id: 't-created-1',
        ...newTrackData,
        tags: [],
        bpm: 120,
        genre: 'Synthwave',
        playsCount: 0,
        downloadsCount: 0,
        isSold: false,
        producer: { name: 'Producer 1', artistName: 'ProdOne' },
      });

      const result = await service.create(newTrackData);
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Cyberpunk Synth');
    });
  });

  describe('remove', () => {
    it('debe eliminar la pista correctamente', async () => {
      prismaService.track.delete.mockResolvedValue({ id: 't-delete-1' });

      const result = await service.remove('t-delete-1');
      expect(result).toEqual({ success: true });
    });
  });
});
