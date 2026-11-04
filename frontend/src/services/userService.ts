import { apiMessage } from './http';
import { API_URL } from './config';
import { User, Track, PublicArtist } from '@/types';

export async function updateProfileApi(
  token: string,
  payload: Partial<{
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
): Promise<User> {
  const res = await fetch(`${API_URL}/users/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(apiMessage(data.message, 'Error al actualizar el perfil.'));
  }
  return data;
}

export async function uploadAvatarApi(token: string, file: File): Promise<User> {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(`${API_URL}/users/profile/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(apiMessage(data.message, 'Error al subir la imagen de avatar.'));
  }
  return data;
}

export async function uploadBannerApi(token: string, file: File): Promise<User> {
  const formData = new FormData();
  formData.append('banner', file);

  const res = await fetch(`${API_URL}/users/profile/banner`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(apiMessage(data.message, 'Error al subir el banner.'));
  }
  return data;
}

export async function fetchFavoritesApi(token: string): Promise<Track[]> {
  const res = await fetch(`${API_URL}/users/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(apiMessage(data.message, 'Error al obtener favoritos.'));
  }
  return data;
}

export async function toggleFavoriteApi(
  token: string,
  trackId: string,
): Promise<{ isFavorite: boolean; message: string }> {
  const res = await fetch(`${API_URL}/users/favorites/${trackId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(apiMessage(data.message, 'Error al cambiar estado de favorito.'));
  }
  return data;
}

export async function fetchPublicArtistApi(id: string): Promise<PublicArtist> {
  const res = await fetch(`${API_URL}/artists/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(apiMessage(data.message, 'No se pudo cargar el perfil del artista.'));
  }
  return data;
}
