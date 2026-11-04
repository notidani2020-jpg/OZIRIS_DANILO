import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Track } from './dto';
import { INITIAL_TRACKS } from './mock-tracks.data';

export type { Track };

@Injectable()
export class TracksService {
  private inMemoryTracks: Track[] = [...INITIAL_TRACKS];

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    genre?: string;
    search?: string;
    tag?: string;
    maxPrice?: number;
    category?: string;
    sort?: string;
  }): Promise<Track[]> {
    const genre = params?.genre;
    const search = params?.search?.trim();
    const tag = params?.tag?.trim();
    const maxPrice = params?.maxPrice;
    const category = params?.category;
    const sort = params?.sort || 'newest';

    try {
      const where: any = {};
      const andConditions: any[] = [];

      if (genre && genre !== 'all') {
        andConditions.push({
          genre: { equals: genre, mode: 'insensitive' as const },
        });
      }

      if (tag) {
        andConditions.push({
          tags: { has: tag },
        });
      }

      if (maxPrice !== undefined && !isNaN(maxPrice)) {
        andConditions.push({
          price: { lte: maxPrice },
        });
      }

      if (category) {
        if (category === 'under20') {
          andConditions.push({ price: { lte: 20 } });
        } else if (category === 'free') {
          andConditions.push({ price: { lte: 15 } });
        } else if (category === 'exclusive') {
          andConditions.push({ price: { gte: 35 } });
        } else if (category === 'coro' || category === 'vocals') {
          andConditions.push({
            OR: [
              { tags: { has: 'coro' } },
              { tags: { has: 'vocals' } },
              { tags: { has: 'hook' } },
              { title: { contains: 'coro', mode: 'insensitive' as const } },
              { title: { contains: 'vocals', mode: 'insensitive' as const } },
            ],
          });
        }
      }

      if (search) {
        andConditions.push({
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { genre: { contains: search, mode: 'insensitive' as const } },
            { key: { contains: search, mode: 'insensitive' as const } },
            {
              producer: {
                name: { contains: search, mode: 'insensitive' as const },
              },
            },
            {
              producer: {
                artistName: { contains: search, mode: 'insensitive' as const },
              },
            },
            { tags: { has: search } },
          ],
        });
      }

      if (andConditions.length > 0) {
        where.AND = andConditions;
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'price_asc') {
        orderBy = { price: 'asc' };
      } else if (sort === 'price_desc') {
        orderBy = { price: 'desc' };
      } else if (sort === 'bpm_asc') {
        orderBy = { bpm: 'asc' };
      } else if (sort === 'bpm_desc') {
        orderBy = { bpm: 'desc' };
      }

      const dbTracks = await this.prisma.track.findMany({
        where,
        include: { producer: true },
        orderBy,
      });

      if (dbTracks && dbTracks.length > 0) {
        return dbTracks.map((t) => this.formatTrack(t));
      }
    } catch (e) {
      console.error(
        'Error fetching tracks from DB (fallback to memory):',
        e?.message || e,
      );
    }

    // In-memory fallback
    let list = [...this.inMemoryTracks];
    if (genre && genre !== 'all') {
      list = list.filter((t) => t.genre?.toLowerCase() === genre.toLowerCase());
    }
    if (tag) {
      list = list.filter((t) =>
        t.tags?.some((tg) => tg.toLowerCase() === tag.toLowerCase()),
      );
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      list = list.filter((t) => Number(t.price) <= maxPrice);
    }
    if (category === 'under20') {
      list = list.filter((t) => Number(t.price) <= 20);
    } else if (category === 'free') {
      list = list.filter((t) => Number(t.price) <= 15);
    } else if (category === 'exclusive') {
      list = list.filter((t) => Number(t.price) >= 35);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.genre?.toLowerCase().includes(q) ||
          t.tags?.some((tg) => tg.toLowerCase().includes(q)) ||
          t.producer?.name.toLowerCase().includes(q) ||
          t.producer?.artistName?.toLowerCase().includes(q) ||
          (t.bpm && t.bpm.toString().includes(q)) ||
          (t.key && t.key.toLowerCase().includes(q)),
      );
    }
    return list;
  }

  async findOne(id: string): Promise<Track> {
    try {
      const track = await this.prisma.track.findUnique({
        where: { id },
        include: { producer: true },
      });
      if (track) return this.formatTrack(track);
    } catch (e) {
      // Fallback
    }

    const track = this.inMemoryTracks.find((t) => t.id === id);
    if (!track) {
      throw new NotFoundException(`Beat con ID ${id} no encontrado.`);
    }
    return track;
  }

  async create(data: Partial<Track> & { producerId?: string }): Promise<Track> {
    const producerId = data.producerId || 'user-admin-1';

    // Verify that the user has an artist profile or producer/admin role
    if (producerId && producerId !== 'user-admin-1') {
      try {
        const u = await this.prisma.user.findUnique({
          where: { id: producerId },
          include: { artist: true },
        });
        if (u && u.role === 'USER' && !u.artist) {
          throw new ForbiddenException(
            'Acceso denegado: Solo los usuarios con perfil de artista o productores pueden subir beats.',
          );
        }
      } catch (e: any) {
        if (e instanceof ForbiddenException) throw e;
      }
    }

    // Fetch producer from DB to get avatar if cover not provided
    let producerAvatarUrl: string | null = null;
    try {
      const p = await this.prisma.user.findUnique({
        where: { id: producerId },
      });
      if (p) producerAvatarUrl = p.avatarUrl;
    } catch (e) {}

    const newTrack: Track = {
      id: `track-${Date.now()}`,
      title: data.title || 'Untitled Beat',
      description: data.description || '',
      price: Number(data.price) || 29.99,
      genre: data.genre || 'Trap',
      bpm: Number(data.bpm) || 120,
      key: data.key || 'C Minor',
      tags: data.tags || [],
      audioUrl: data.audioUrl || '',
      fullAudioUrl: data.fullAudioUrl || data.audioUrl || '',
      coverUrl: data.coverUrl || producerAvatarUrl || '',
      producerId: producerId,
      producer: {
        id: producerId,
        name: 'Oziris Producer',
        email: 'producer@oziris.com',
        avatarUrl: producerAvatarUrl,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const created = await this.prisma.track.create({
        data: {
          id: newTrack.id,
          title: newTrack.title,
          description: newTrack.description,
          price: newTrack.price,
          genre: newTrack.genre,
          bpm: newTrack.bpm,
          key: newTrack.key,
          tags: newTrack.tags || [],
          audioUrl: newTrack.audioUrl,
          fullAudioUrl: newTrack.fullAudioUrl,
          coverUrl: newTrack.coverUrl,
          producerId: producerId,
        },
        include: { producer: true },
      });
      if (created) return this.formatTrack(created);
    } catch (e) {
      console.error(
        'DB create track error (using in-memory fallback):',
        e?.message || e,
      );
    }

    this.inMemoryTracks.unshift(newTrack);
    return newTrack;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.track.delete({ where: { id } });
    } catch (e) {
      // Fallback
    }
    this.inMemoryTracks = this.inMemoryTracks.filter((t) => t.id !== id);
    return { success: true };
  }

  private formatTrack(t: any): Track {
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      price: t.price,
      genre: t.genre,
      bpm: t.bpm,
      key: t.key,
      tags: t.tags || [],
      audioUrl: t.audioUrl,
      fullAudioUrl: t.fullAudioUrl || t.audioUrl,
      coverUrl: t.coverUrl || t.producer?.avatarUrl || null,
      producerId: t.producerId,
      producer: t.producer
        ? {
            id: t.producer.id,
            name: t.producer.name,
            email: t.producer.email,
            avatarUrl: t.producer.avatarUrl || null,
            artistName: t.producer.artistName || null,
          }
        : {
            id: t.producerId,
            name: 'Oziris Producer',
            email: 'producer@oziris.com',
            avatarUrl: null,
            artistName: null,
          },
      createdAt:
        t.createdAt instanceof Date
          ? t.createdAt.toISOString()
          : t.createdAt || new Date().toISOString(),
      updatedAt:
        t.updatedAt instanceof Date
          ? t.updatedAt.toISOString()
          : t.updatedAt || new Date().toISOString(),
    };
  }
}
