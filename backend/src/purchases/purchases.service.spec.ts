import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesService } from './purchases.service';
import { PrismaService } from '../prisma/prisma.service';
import { TracksService } from '../tracks/tracks.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PurchasesService', () => {
  let service: PurchasesService;
  let prismaService: any;
  let tracksService: any;

  beforeEach(async () => {
    prismaService = {
      purchase: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      paymentSimulation: {
        create: jest.fn(),
      },
      downloadLog: {
        create: jest.fn(),
        count: jest.fn(),
      },
    };

    tracksService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PrismaService, useValue: prismaService },
        { provide: TracksService, useValue: tracksService },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
  });

  describe('simulatePayment', () => {
    it('debe arrojar BadRequestException si no se envían trackId ni trackIds', async () => {
      await expect(
        service.simulatePayment('user-1', 'USER', {
          payerName: 'Carlos',
          payerEmail: 'carlos@mail.com',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe arrojar NotFoundException si la pista indicada no existe', async () => {
      tracksService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.simulatePayment('user-1', 'USER', {
          trackId: 'track-404',
          paymentMethod: 'PSE',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe completar la compra simulada exitosamente cuando la pista existe', async () => {
      const mockTrack = {
        id: 'track-1',
        title: 'Trap Sunset',
        price: 29.99,
        audioUrl: '/audio.mp3',
        coverUrl: '/cover.jpg',
      };
      tracksService.findOne.mockResolvedValue(mockTrack);
      prismaService.purchase.findFirst.mockResolvedValue(null);
      prismaService.purchase.create.mockResolvedValue({
        id: 'purchase-1',
        amount: 29.99,
        status: 'COMPLETED',
        paymentMethod: 'PSE',
        licenseType: 'ESTÁNDAR COMERCIAL (MP3 HQ)',
        transactionId: 'OZ-SIM-12345',
        userId: 'user-1',
        trackId: 'track-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        track: mockTrack,
      });

      const result = await service.simulatePayment('user-1', 'USER', {
        trackId: 'track-1',
        paymentMethod: 'PSE',
        payerName: 'Carlos Test',
        payerEmail: 'carlos@test.com',
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('transactionId');
      expect(result.purchases).toHaveLength(1);
    });
  });

  describe('checkPurchaseStatus', () => {
    it('debe indicar purchased: true si la compra existe y está COMPLETED', async () => {
      prismaService.purchase.findFirst.mockResolvedValue({
        id: 'purch-1',
        status: 'COMPLETED',
        createdAt: new Date(),
        licenseType: 'STANDARD',
        transactionId: 'OZ-SIM-TEST',
        paymentMethod: 'PSE',
        downloadCount: 0,
        lastDownloadedAt: null,
      });

      const status = await service.checkPurchaseStatus('user-1', 'track-1');
      expect(status.purchased).toBe(true);
      expect(status).toHaveProperty('purchaseId', 'purch-1');
    });

    it('debe indicar purchased: false si no se encuentra registro', async () => {
      prismaService.purchase.findFirst.mockResolvedValue(null);

      const status = await service.checkPurchaseStatus('user-1', 'track-999');
      expect(status.purchased).toBe(false);
    });
  });

  describe('getUserPurchases', () => {
    it('debe retornar la lista de compras del usuario', async () => {
      const mockPurchases = [
        {
          id: 'purch-1',
          trackId: 'track-1',
          amount: 29.99,
          status: 'COMPLETED',
          track: { title: 'Drill Heat' },
        },
      ];
      prismaService.purchase.findMany.mockResolvedValue(mockPurchases);

      const purchases = await service.getUserPurchases('user-1');
      expect(purchases).toHaveLength(1);
      expect(purchases[0].id).toBe('purch-1');
    });
  });
});
