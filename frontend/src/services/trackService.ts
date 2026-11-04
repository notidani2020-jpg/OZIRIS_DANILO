import { API_URL } from './config';
import { Track } from '@/types';

export interface FetchTracksParams {
  genre?: string;
  search?: string;
  tag?: string;
  maxPrice?: number;
  category?: string;
  sort?: string;
  producerId?: string;
}

export async function fetchTracks(
  params?: string | FetchTracksParams,
): Promise<Track[]> {
  const queryParams = new URLSearchParams();

  if (typeof params === 'string') {
    if (params) queryParams.set('genre', params);
  } else if (params) {
    if (params.genre) queryParams.set('genre', params.genre);
    if (params.search) queryParams.set('search', params.search);
    if (params.tag) queryParams.set('tag', params.tag);
    if (params.maxPrice !== undefined) queryParams.set('maxPrice', params.maxPrice.toString());
    if (params.category) queryParams.set('category', params.category);
    if (params.sort) queryParams.set('sort', params.sort);
    if (params.producerId) queryParams.set('producerId', params.producerId);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `${API_URL}/tracks?${queryString}` : `${API_URL}/tracks`;
  
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Error al obtener la lista de Beats.');
  }
  return res.json();
}

export async function fetchTrackById(id: string): Promise<Track> {
  const res = await fetch(`${API_URL}/tracks/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Error al obtener el Beat.');
  }
  return res.json();
}

export function uploadBeat(
  formData: FormData,
  token: string,
  onProgress?: (percent: number) => void,
): Promise<Track> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/tracks`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error('Respuesta inválida del servidor.'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.message || 'Error al subir el Beat.'));
        } catch (e) {
          reject(new Error(`Error al subir el Beat (código ${xhr.status}).`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Error de conexión con el servidor backend.'));
    };

    xhr.send(formData);
  });
}

export async function updateTrackApi(
  token: string,
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    price: number;
    genre: string;
    bpm: number;
    key: string;
    tags: string[];
  }>,
): Promise<Track> {
  const res = await fetch(`${API_URL}/tracks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(' ') : data.message;
    throw new Error(msg || 'Error al actualizar el Beat.');
  }
  return data;
}

/** Registra una reproducción (no bloquea la UI si falla). */
export function registerPlayApi(id: string): void {
  fetch(`${API_URL}/tracks/${id}/play`, { method: 'POST' }).catch(() => {});
}
