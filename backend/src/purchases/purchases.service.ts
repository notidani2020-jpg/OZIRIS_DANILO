import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TracksService } from '../tracks/tracks.service';
import { join } from 'path';
import { existsSync, createReadStream } from 'fs';
import { Response } from 'express';
import { SimulatedPurchaseDto } from './dto';

export { SimulatedPurchaseDto };

@Injectable()
export class PurchasesService {
  private inMemoryPurchases: any[] = [];
  private inMemorySimulations: any[] = [];
  private inMemoryDownloads: any[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly tracksService: TracksService,
  ) {}

  /**
   * Simula un pago y registra la compra/licencia para el usuario autenticado en la base de datos PostgreSQL.
   * Todos los roles autenticados (USER, BUYER, PRODUCER, ADMIN) pueden simular compras.
   */
  async simulatePayment(
    userId: string,
    userRole: string,
    dto: SimulatedPurchaseDto,
  ) {
    const trackIdsToProcess: string[] =
      dto.trackIds && dto.trackIds.length > 0
        ? dto.trackIds
        : dto.trackId
          ? [dto.trackId]
          : [];

    if (trackIdsToProcess.length === 0) {
      throw new BadRequestException(
        'Debes proporcionar al menos un Beat (trackId o trackIds).',
      );
    }

    const paymentMethod = dto.paymentMethod || 'PSE';
    const licenseType = dto.licenseType || 'ESTÁNDAR COMERCIAL (MP3 HQ)';
    const transactionId = `OZ-SIM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const completedPurchases: any[] = [];

    for (const trackId of trackIdsToProcess) {
      let track = null;
      try {
        track = await this.tracksService.findOne(trackId);
      } catch (err) {
        throw new NotFoundException(
          `El beat con ID ${trackId} no fue encontrado.`,
        );
      }

      // El monto SIEMPRE sale del precio del beat en base de datos (nunca del cliente).
      const amount = track.price ?? 29.99;

      try {
        // Verificar si ya existe compra previa del mismo track por este usuario
        const existing = await this.prisma.purchase.findFirst({
          where: {
            userId,
            trackId,
            status: 'COMPLETED',
          },
        });

        if (existing) {
          completedPurchases.push({
            id: existing.id,
            trackId,
            trackTitle: track.title,
            amount: existing.amount,
            status: existing.status,
            paymentMethod: existing.paymentMethod || paymentMethod,
            licenseType: existing.licenseType || licenseType,
            transactionId: existing.transactionId || transactionId,
            createdAt: existing.createdAt,
            downloadUrl: `/purchases/download/${trackId}`,
            alreadyOwned: true,
          });
          continue;
        }

        // Crear registro en la tabla Purchase y PaymentSimulation de PostgreSQL
        const created = await this.prisma.purchase.create({
          data: {
            userId,
            trackId,
            amount,
            status: 'COMPLETED',
            paymentMethod,
            licenseType,
            transactionId,
            payerName: dto.payerName || null,
            payerEmail: dto.payerEmail || null,
            payerPhone: dto.payerPhone || null,
            payerDocument: dto.payerDocument || null,
            paymentProvider:
              dto.bankName ||
              (paymentMethod === 'Tarjeta'
                ? 'Tarjeta de Crédito/Débito'
                : paymentMethod),
            simulation: {
              create: {
                transactionId: `${transactionId}-${trackId.substring(0, 6)}`,
                method: paymentMethod,
                amount,
                currency: 'USD',
                status: 'APPROVED',
                payerName: dto.payerName || null,
                payerEmail: dto.payerEmail || null,
                payerPhone: dto.payerPhone || null,
                payerDocument: dto.payerDocument || null,
                bankName: dto.bankName || null,
                personType: dto.personType || null,
                cardHolder: dto.cardHolder || null,
                cardLastFour: dto.cardLastFour || null,
                phoneNumber: dto.phoneNumber || null,
                metadata: dto.metadata ? dto.metadata : undefined,
                userId,
              },
            },
          },
          include: {
            track: true,
            simulation: true,
          },
        });

        completedPurchases.push({
          id: created.id,
          trackId: created.trackId,
          trackTitle: track.title,
          amount: created.amount,
          status: created.status,
          paymentMethod: created.paymentMethod,
          licenseType: created.licenseType,
          transactionId: created.transactionId,
          createdAt: created.createdAt,
          downloadUrl: `/purchases/download/${trackId}`,
          alreadyOwned: false,
        });
      } catch (dbError) {
        console.error(
          'Error guardando en PostgreSQL (fallback en memoria):',
          dbError,
        );
        // Fallback en memoria si falla la BD
        const fallbackPurchase = {
          id: `sim-purch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId,
          trackId,
          trackTitle: track.title,
          amount,
          status: 'COMPLETED',
          paymentMethod,
          licenseType,
          transactionId,
          createdAt: new Date().toISOString(),
          downloadUrl: `/purchases/download/${trackId}`,
          alreadyOwned: false,
        };
        this.inMemoryPurchases.push(fallbackPurchase);
        completedPurchases.push(fallbackPurchase);
      }
    }

    return {
      success: true,
      message:
        '¡Pago simulado con éxito! Tu licencia ha sido generada y el beat está disponible para descarga.',
      transactionId,
      paymentMethod,
      licenseType,
      purchasedAt: new Date().toISOString(),
      purchases: completedPurchases,
    };
  }

  /**
   * Obtiene la lista de compras del usuario autenticado.
   */
  async getUserPurchases(userId: string) {
    try {
      const dbPurchases = await this.prisma.purchase.findMany({
        where: {
          userId,
          status: 'COMPLETED',
        },
        include: {
          track: {
            include: {
              producer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  artistName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          simulation: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (dbPurchases && dbPurchases.length > 0) {
        return dbPurchases.map((p) => ({
          id: p.id,
          trackId: p.trackId,
          amount: p.amount,
          status: p.status,
          paymentMethod: p.paymentMethod || 'PSE',
          licenseType: p.licenseType || 'ESTÁNDAR COMERCIAL',
          transactionId: p.transactionId,
          downloadCount: p.downloadCount,
          lastDownloadedAt: p.lastDownloadedAt,
          payerName: p.payerName,
          payerEmail: p.payerEmail,
          paymentProvider: p.paymentProvider,
          createdAt: p.createdAt,
          track: p.track,
          downloadUrl: `/purchases/download/${p.trackId}`,
        }));
      }
    } catch (err) {
      console.error(
        'Error consultando compras en DB (usando in-memory fallback):',
        err,
      );
    }

    // Fallback en memoria
    const userMemoryPurchases = this.inMemoryPurchases.filter(
      (p) => p.userId === userId,
    );
    const result = [];
    for (const p of userMemoryPurchases) {
      try {
        const track = await this.tracksService.findOne(p.trackId);
        result.push({
          ...p,
          trackId: p.trackId,
          track,
        });
      } catch {
        result.push(p);
      }
    }
    return result;
  }

  /**
   * Verifica si un usuario ya adquirió un beat específico o tiene permiso de descarga.
   */
  async checkPurchaseStatus(userId: string, trackId: string) {
    try {
      const purchase = await this.prisma.purchase.findFirst({
        where: {
          userId,
          trackId,
          status: 'COMPLETED',
        },
      });

      if (purchase) {
        return {
          purchased: true,
          purchaseId: purchase.id,
          transactionId: purchase.transactionId,
          paymentMethod: purchase.paymentMethod,
          licenseType: purchase.licenseType,
          purchasedAt: purchase.createdAt,
          downloadCount: purchase.downloadCount,
          lastDownloadedAt: purchase.lastDownloadedAt,
          downloadUrl: `/purchases/download/${trackId}`,
        };
      }
    } catch (err) {
      // Check in-memory fallback
    }

    const inMem = this.inMemoryPurchases.find(
      (p) =>
        p.userId === userId &&
        p.trackId === trackId &&
        p.status === 'COMPLETED',
    );

    if (inMem) {
      return {
        purchased: true,
        purchaseId: inMem.id,
        transactionId: inMem.transactionId,
        paymentMethod: inMem.paymentMethod,
        licenseType: inMem.licenseType,
        purchasedAt: inMem.createdAt,
        downloadCount: inMem.downloadCount || 0,
        lastDownloadedAt: inMem.lastDownloadedAt || null,
        downloadUrl: `/purchases/download/${trackId}`,
      };
    }

    return {
      purchased: false,
    };
  }

  /**
   * Endpoint de entrega y descarga directa del archivo de audio del beat.
   * Valida permisos (compra previa, productor del beat o administrador).
   * Hace streaming directo del archivo (local o remoto) con headers de Content-Disposition y CORS.
   */
  async handleDownload(
    userId: string,
    userRole: string,
    trackId: string,
    res: Response,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    let track = null;
    try {
      track = await this.tracksService.findOne(trackId);
    } catch {
      throw new NotFoundException(`El Beat con ID ${trackId} no existe.`);
    }

    if (!track) {
      throw new NotFoundException(`El Beat con ID ${trackId} no existe.`);
    }

    // Permitir descarga si el usuario compró el beat, o es el productor, o es ADMIN
    const isProducer = track.producerId === userId;
    const isAdmin = userRole === 'ADMIN';
    const purchaseStatus = await this.checkPurchaseStatus(userId, trackId);

    if (!purchaseStatus.purchased && !isProducer && !isAdmin) {
      throw new ForbiddenException(
        'Acceso denegado. Debes simular el pago y adquirir la licencia del Beat antes de poder descargarlo.',
      );
    }

    // Registrar la descarga en la base de datos PostgreSQL
    try {
      await this.prisma.downloadLog.create({
        data: {
          userId,
          trackId,
          purchaseId: purchaseStatus.purchaseId || null,
          ipAddress: meta?.ipAddress || null,
          userAgent: meta?.userAgent || null,
          fileFormat: 'MP3',
        },
      });

      // Incrementar contador en Purchase si aplica
      if (purchaseStatus.purchaseId) {
        await this.prisma.purchase.update({
          where: { id: purchaseStatus.purchaseId },
          data: {
            downloadCount: { increment: 1 },
            lastDownloadedAt: new Date(),
          },
        });
      }

      // Incrementar contador de descargas en Track
      await this.prisma.track.update({
        where: { id: trackId },
        data: {
          downloadsCount: { increment: 1 },
        },
      });
    } catch (logError) {
      console.warn(
        'Advertencia al registrar log de descarga en DB:',
        logError?.message || logError,
      );
      this.inMemoryDownloads.push({
        userId,
        trackId,
        purchaseId: purchaseStatus.purchaseId,
        downloadedAt: new Date().toISOString(),
      });
    }

    const rawAudioUrl = track.fullAudioUrl || track.audioUrl;
    if (!rawAudioUrl) {
      throw new NotFoundException(
        'Este beat no tiene un archivo de audio disponible para descarga.',
      );
    }

    // Limpiar y preparar nombre del archivo descargable
    const safeTitle = (track.title || 'beat')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const downloadFilename = `OZIRIS_${safeTitle}_HQ.mp3`;

    // 1. Si es un archivo local en uploads (por ruta relativa o URL local)
    let localRelativePath: string | null = null;

    if (
      rawAudioUrl.startsWith('/uploads/') ||
      rawAudioUrl.startsWith('uploads/')
    ) {
      localRelativePath = rawAudioUrl.startsWith('/')
        ? rawAudioUrl.slice(1)
        : rawAudioUrl;
    } else if (rawAudioUrl.includes('/uploads/')) {
      const parts = rawAudioUrl.split('/uploads/');
      if (parts[1]) {
        localRelativePath = `uploads/${parts[1]}`;
      }
    }

    if (localRelativePath) {
      const candidates = [
        join(process.cwd(), localRelativePath),
        join(process.cwd(), 'backend', localRelativePath),
        join(__dirname, '..', '..', localRelativePath),
      ];

      for (const p of candidates) {
        if (existsSync(p)) {
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${downloadFilename}"`,
          );
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
          const fileStream = createReadStream(p);
          return fileStream.pipe(res);
        }
      }
    }

    // 2. Si es una URL externa (e.g. SoundHelix o CDN remoto), hacer streaming server-side para evitar bloqueos CORS
    if (
      rawAudioUrl.startsWith('http://') ||
      rawAudioUrl.startsWith('https://')
    ) {
      try {
        const remoteRes = await fetch(rawAudioUrl);
        if (!remoteRes.ok) {
          throw new Error(`Remote audio returned status ${remoteRes.status}`);
        }

        const arrayBuffer = await remoteRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${downloadFilename}"`,
        );
        res.setHeader(
          'Content-Type',
          remoteRes.headers.get('content-type') || 'audio/mpeg',
        );
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        return res.end(buffer);
      } catch (proxyError) {
        console.error(
          'Error al hacer proxy/streaming del audio remoto:',
          proxyError,
        );
        // Como último recurso intentar redirección
        return res.redirect(rawAudioUrl);
      }
    }

    throw new NotFoundException(
      'No se pudo localizar el archivo físico de audio del beat.',
    );
  }
}
