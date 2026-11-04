import { API_URL } from './config';
import { AdminStats, User } from '@/types';

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const res = await fetch(`${API_URL}/users/stats`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error al obtener estadísticas del administrador.');
  }
  return data;
}

export async function fetchAdminUsers(token: string, search?: string): Promise<User[]> {
  const url = search
    ? `${API_URL}/users?search=${encodeURIComponent(search)}`
    : `${API_URL}/users`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error al obtener la lista de usuarios.');
  }
  return data;
}

export async function updateAdminUser(
  token: string,
  id: string,
  payload: Partial<{
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
): Promise<User> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error al actualizar usuario.');
  }
  return data;
}

export async function deleteAdminUser(token: string, id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error al eliminar usuario.');
  }
  return data;
}

export async function deleteTrackApi(token: string, id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/tracks/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error al eliminar Beat.');
  }
  return data;
}
