import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserResponse, ArtistResponse } from './dto';
import { INITIAL_USERS } from './mock-users.data';

export type { UserResponse, ArtistResponse };

@Injectable()
export class UsersService {
  private inMemoryUsers = [...INITIAL_USERS];
  private inMemoryFavorites: { id: string; userId: string; trackId: string }[] =
    [];

  constructor(private prisma: PrismaService) {}

  async findAll(search?: string): Promise<UserResponse[]> {
    try {
      const dbUsers = await this.prisma.user.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { artistName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        include: { artist: true },
        orderBy: { createdAt: 'desc' },
      });
      if (dbUsers && dbUsers.length > 0) {
        return dbUsers.map((u) => this.sanitizeUser(u));
      }
    } catch (e) {
      // Fallback
    }

    let filtered = this.inMemoryUsers;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.artistName && u.artistName.toLowerCase().includes(q)),
      );
    }
    return filtered.map((u) => this.sanitizeUser(u));
  }

  async findById(id: string): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { artist: true },
      });
      if (user) return this.sanitizeUser(user);
    } catch (e) {
      // Fallback
    }

    const user = this.inMemoryUsers.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }
    return this.sanitizeUser(user);
  }

  async findByEmailWithPassword(email: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user) return user;
    } catch (e) {
      // Fallback
    }

    return this.inMemoryUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    artisticName?: string;
    genre?: string;
  }) {
    const existing = await this.findByEmailWithPassword(data.email);
    if (existing) {
      throw new ConflictException(
        'El correo electrónico ya se encuentra registrado.',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const assignedRole =
      data.role === 'ADMIN'
        ? 'ADMIN'
        : data.role === 'PRODUCER'
          ? 'PRODUCER'
          : 'USER';
    const isArtist = assignedRole === 'PRODUCER';
    const finalArtistName = isArtist
      ? data.artisticName?.trim() || data.name.trim()
      : null;

    const newUser = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      password: hashedPassword,
      artistName: finalArtistName,
      role: assignedRole as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const dbUser = await this.prisma.user.create({
        data: {
          ...newUser,
          artist: isArtist
            ? {
                create: {
                  artisticName: finalArtistName || data.name.trim(),
                  genre: data.genre?.trim() || null,
                  verified: false,
                },
              }
            : undefined,
        },
        include: {
          artist: true,
        },
      });
      return this.sanitizeUser(dbUser);
    } catch (e) {
      // Fallback
    }

    const memoryUser = {
      ...newUser,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    };
    this.inMemoryUsers.unshift(memoryUser);
    return this.sanitizeUser(memoryUser);
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      name: string;
      lastName: string;
      artistName: string;
      location: string;
      bio: string;
      avatarUrl: string;
      genre: string;
      bannerUrl: string;
      spotifyUrl: string;
      instagramUrl: string;
      youtubeUrl: string;
    }>,
  ): Promise<UserResponse> {
    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          lastName: data.lastName,
          artistName: data.artistName,
          location: data.location,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
        },
        include: { artist: true },
      });
      if (updated) {
        const hasArtistData = [
          data.artistName,
          data.bio,
          data.genre,
          data.bannerUrl,
          data.spotifyUrl,
          data.instagramUrl,
          data.youtubeUrl,
        ].some((v) => v !== undefined);
        if (updated.role === 'PRODUCER' && hasArtistData) {
          const artistFields = {
            artisticName: data.artistName?.trim() || undefined,
            bio: data.bio,
            genre: data.genre,
            bannerUrl: data.bannerUrl,
            spotifyUrl: data.spotifyUrl,
            instagramUrl: data.instagramUrl,
            youtubeUrl: data.youtubeUrl,
          };
          const artist = await this.prisma.artist.upsert({
            where: { userId },
            update: artistFields,
            create: {
              ...artistFields,
              artisticName:
                artistFields.artisticName ||
                updated.artistName ||
                updated.name,
              userId,
            },
          });
          return this.sanitizeUser({ ...updated, artist });
        }
        return this.sanitizeUser(updated);
      }
    } catch (e) {
      // Fallback
    }

    const index = this.inMemoryUsers.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const current = this.inMemoryUsers[index];
    const updatedMemory = {
      ...current,
      name: data.name !== undefined ? data.name : current.name,
      lastName: data.lastName !== undefined ? data.lastName : current.lastName,
      artistName:
        data.artistName !== undefined ? data.artistName : current.artistName,
      location: data.location !== undefined ? data.location : current.location,
      bio: data.bio !== undefined ? data.bio : current.bio,
      avatarUrl:
        data.avatarUrl !== undefined ? data.avatarUrl : current.avatarUrl,
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryUsers[index] = updatedMemory;
    return this.sanitizeUser(updatedMemory);
  }

  async updateUser(
    id: string,
    data: Partial<{
      name: string;
      lastName: string;
      artistName: string;
      location: string;
      role: string;
      isActive: boolean;
      bio: string;
      avatarUrl: string;
      verified: boolean;
    }>,
  ): Promise<UserResponse> {
    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          name: data.name,
          lastName: data.lastName,
          artistName: data.artistName,
          location: data.location,
          role: data.role as any,
          isActive: data.isActive,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
        },
        include: { artist: true },
      });
      if (updated) {
        // Un PRODUCER siempre debe tener su ficha de artista.
        if (updated.role === 'PRODUCER') {
          const artist = await this.prisma.artist.upsert({
            where: { userId: id },
            update: data.verified !== undefined ? { verified: data.verified } : {},
            create: {
              artisticName: updated.artistName || updated.name,
              verified: data.verified ?? false,
              userId: id,
            },
          });
          return this.sanitizeUser({ ...updated, artist });
        }
        return this.sanitizeUser(updated);
      }
    } catch (e) {
      // Fallback
    }

    const index = this.inMemoryUsers.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    const current = this.inMemoryUsers[index];
    const updatedMemory = {
      ...current,
      name: data.name !== undefined ? data.name : current.name,
      lastName: data.lastName !== undefined ? data.lastName : current.lastName,
      artistName:
        data.artistName !== undefined ? data.artistName : current.artistName,
      location: data.location !== undefined ? data.location : current.location,
      role: data.role !== undefined ? data.role : current.role,
      isActive: data.isActive !== undefined ? data.isActive : current.isActive,
      bio: data.bio !== undefined ? data.bio : current.bio,
      avatarUrl:
        data.avatarUrl !== undefined ? data.avatarUrl : current.avatarUrl,
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryUsers[index] = updatedMemory;
    return this.sanitizeUser(updatedMemory);
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (e) {
      // Fallback
    }

    const index = this.inMemoryUsers.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.inMemoryUsers.splice(index, 1);
    }
    return { success: true, message: 'Usuario eliminado correctamente.' };
  }

  // FAVORITES
  async toggleFavorite(userId: string, trackId: string) {
    try {
      const existing = await this.prisma.favorite.findUnique({
        where: { userId_trackId: { userId, trackId } },
      });

      if (existing) {
        await this.prisma.favorite.delete({
          where: { id: existing.id },
        });
        return { isFavorite: false, message: 'Removido de favoritos.' };
      } else {
        await this.prisma.favorite.create({
          data: { userId, trackId },
        });
        return { isFavorite: true, message: 'Guardado en favoritos.' };
      }
    } catch (e) {
      // In-memory fallback
      const idx = this.inMemoryFavorites.findIndex(
        (f) => f.userId === userId && f.trackId === trackId,
      );
      if (idx !== -1) {
        this.inMemoryFavorites.splice(idx, 1);
        return { isFavorite: false, message: 'Removido de favoritos.' };
      } else {
        this.inMemoryFavorites.push({
          id: `fav-${Date.now()}`,
          userId,
          trackId,
        });
        return { isFavorite: true, message: 'Guardado en favoritos.' };
      }
    }
  }

  async getUserFavorites(userId: string) {
    try {
      const favorites = await this.prisma.favorite.findMany({
        where: { userId },
        include: { track: { include: { producer: true } } },
      });
      if (favorites) {
        return favorites.map((f) => f.track);
      }
    } catch (e) {
      // Fallback
    }

    const userFavs = this.inMemoryFavorites.filter((f) => f.userId === userId);
    return userFavs.map((f) => f.trackId);
  }

  async getAdminStats() {
    let totalUsers = 0;
    let activeUsers = 0;
    let totalProducers = 0;
    let totalTracks = 0;
    let totalSales = 0;
    let totalRevenue = 0;

    try {
      totalUsers = await this.prisma.user.count();
      activeUsers = await this.prisma.user.count({ where: { isActive: true } });
      totalProducers = await this.prisma.user.count({
        where: { role: 'PRODUCER' as any },
      });
      totalTracks = await this.prisma.track.count();
      const sales = await this.prisma.purchase.aggregate({
        where: { status: 'COMPLETED' },
        _count: { _all: true },
        _sum: { amount: true },
      });
      totalSales = sales._count._all;
      totalRevenue = Math.round((sales._sum.amount ?? 0) * 100) / 100;
    } catch (e) {
      totalUsers = this.inMemoryUsers.length;
      activeUsers = this.inMemoryUsers.filter((u) => u.isActive).length;
      totalProducers = this.inMemoryUsers.filter(
        (u) => u.role === 'PRODUCER' || u.role === 'ADMIN',
      ).length;
      totalTracks = 0;
      totalSales = 0;
      totalRevenue = 0;
    }

    return {
      totalUsers,
      activeUsers,
      totalProducers,
      totalTracks,
      totalSales,
      totalRevenue,
    };
  }

  /** Datos públicos de un artista (sin correo ni datos privados). */
  async getPublicArtist(id: string) {
    let user: any = null;
    let tracksCount = 0;
    let totalPlays = 0;
    try {
      user = await this.prisma.user.findUnique({
        where: { id },
        include: { artist: true },
      });
      if (user && user.role === 'PRODUCER' && user.isActive) {
        const agg = await this.prisma.track.aggregate({
          where: { producerId: id },
          _count: { _all: true },
          _sum: { playsCount: true },
        });
        tracksCount = agg._count._all;
        totalPlays = agg._sum.playsCount ?? 0;
      }
    } catch (e) {
      user = this.inMemoryUsers.find((u) => u.id === id) ?? null;
    }

    if (!user || user.role !== 'PRODUCER' || user.isActive === false) {
      throw new NotFoundException('Artista no encontrado.');
    }

    const artist = user.artist;
    return {
      id: user.id,
      name: user.name,
      artistName: artist?.artisticName || user.artistName || user.name,
      avatarUrl: user.avatarUrl || null,
      location: user.location || null,
      bio: artist?.bio || user.bio || null,
      genre: artist?.genre || null,
      bannerUrl: artist?.bannerUrl || null,
      spotifyUrl: artist?.spotifyUrl || null,
      instagramUrl: artist?.instagramUrl || null,
      youtubeUrl: artist?.youtubeUrl || null,
      verified: artist?.verified ?? false,
      tracksCount,
      totalPlays,
      memberSince:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : user.createdAt || null,
    };
  }

  private sanitizeUser(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      lastName: user.lastName || null,
      artistName:
        user.artistName || (user.artist ? user.artist.artisticName : null),
      location: user.location || null,
      avatarUrl: user.avatarUrl || null,
      bio: user.bio || (user.artist ? user.artist.bio : null),
      role: user.role,
      isActive: user.isActive ?? true,
      artist: user.artist
        ? {
            id: user.artist.id,
            artisticName: user.artist.artisticName,
            bio: user.artist.bio || null,
            genre: user.artist.genre || null,
            bannerUrl: user.artist.bannerUrl || null,
            spotifyUrl: user.artist.spotifyUrl || null,
            instagramUrl: user.artist.instagramUrl || null,
            youtubeUrl: user.artist.youtubeUrl || null,
            verified: user.artist.verified ?? false,
            createdAt:
              user.artist.createdAt instanceof Date
                ? user.artist.createdAt.toISOString()
                : user.artist.createdAt || new Date().toISOString(),
          }
        : null,
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : user.createdAt || new Date().toISOString(),
      updatedAt:
        user.updatedAt instanceof Date
          ? user.updatedAt.toISOString()
          : user.updatedAt || new Date().toISOString(),
    };
  }
}
