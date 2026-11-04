import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiMessage } from './http';
import {
  loginApi,
  changePasswordApi,
  forgotPasswordApi,
} from './authService';
import {
  updateProfileApi,
  fetchPublicArtistApi,
  toggleFavoriteApi,
  uploadBannerApi,
} from './userService';
import {
  fetchTracks,
  uploadBeat,
  updateTrackApi,
  registerPlayApi,
} from './trackService';
import { updateAdminUser, deleteTrackApi } from './adminService';

const API = 'http://localhost:4000';

function mockFetch(body: unknown, ok = true, status = ok ? 200 : 400) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('apiMessage', () => {
  it('devuelve el texto tal cual', () => {
    expect(apiMessage('Algo falló', 'x')).toBe('Algo falló');
  });

  it('une una lista de errores de validación', () => {
    expect(apiMessage(['Correo inválido.', 'Clave corta.'], 'x')).toBe(
      'Correo inválido. Clave corta.',
    );
  });

  it('usa el mensaje por defecto cuando no hay nada útil', () => {
    expect(apiMessage(undefined, 'por defecto')).toBe('por defecto');
    expect(apiMessage('   ', 'por defecto')).toBe('por defecto');
    expect(apiMessage([], 'por defecto')).toBe('por defecto');
    expect(apiMessage(42, 'por defecto')).toBe('por defecto');
  });
});

describe('authService', () => {
  it('loginApi envía credenciales y devuelve la respuesta', async () => {
    const fetchMock = mockFetch({ access_token: 'tok', user: { id: '1' } });
    const res = await loginApi('a@b.co', 'secreto1');
    expect(res.access_token).toBe('tok');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/auth/login`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'a@b.co', password: 'secreto1' });
  });

  it('loginApi propaga el mensaje del backend', async () => {
    mockFetch({ message: 'Credenciales inválidas.' }, false, 401);
    await expect(loginApi('a@b.co', 'mala')).rejects.toThrow('Credenciales inválidas.');
  });

  it('forgotPasswordApi une errores de validación en un solo mensaje', async () => {
    mockFetch({ message: ['Correo electrónico inválido.'] }, false);
    await expect(forgotPasswordApi('x')).rejects.toThrow('Correo electrónico inválido.');
  });

  it('changePasswordApi manda el token y las dos contraseñas', async () => {
    const fetchMock = mockFetch({ message: 'Contraseña actualizada correctamente.' });
    const res = await changePasswordApi('tok', 'vieja', 'nueva123');
    expect(res.message).toMatch(/actualizada/);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/auth/change-password`);
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body)).toEqual({
      currentPassword: 'vieja',
      newPassword: 'nueva123',
    });
  });

  it('changePasswordApi lanza el error del servidor', async () => {
    mockFetch({ message: 'La contraseña actual es incorrecta.' }, false);
    await expect(changePasswordApi('tok', 'x', 'nueva123')).rejects.toThrow(
      'La contraseña actual es incorrecta.',
    );
  });
});

describe('userService', () => {
  it('updateProfileApi hace PATCH con el cuerpo y el token', async () => {
    const fetchMock = mockFetch({ id: 'u1', name: 'Ana' });
    await updateProfileApi('tok', { name: 'Ana', genre: 'Trap' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/users/profile`);
    expect(init.method).toBe('PATCH');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body)).toEqual({ name: 'Ana', genre: 'Trap' });
  });

  it('updateProfileApi muestra los errores de validación del backend', async () => {
    mockFetch({ message: ['URL inválida.'] }, false);
    await expect(updateProfileApi('tok', { spotifyUrl: 'x' })).rejects.toThrow('URL inválida.');
  });

  it('uploadBannerApi envía el archivo en el campo "banner"', async () => {
    const fetchMock = mockFetch({ id: 'u1' });
    const file = new File(['x'], 'b.png', { type: 'image/png' });
    await uploadBannerApi('tok', file);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/users/profile/banner`);
    expect((init.body as FormData).get('banner')).toBeInstanceOf(File);
  });

  it('fetchPublicArtistApi consulta /artists/:id codificando el id', async () => {
    const fetchMock = mockFetch({ id: 'a/b', artistName: 'X' });
    await fetchPublicArtistApi('a/b');
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/artists/a%2Fb`);
  });

  it('fetchPublicArtistApi lanza el mensaje del 404', async () => {
    mockFetch({ message: 'Artista no encontrado.' }, false, 404);
    await expect(fetchPublicArtistApi('zzz')).rejects.toThrow('Artista no encontrado.');
  });

  it('toggleFavoriteApi hace POST al track indicado', async () => {
    const fetchMock = mockFetch({ isFavorite: true, message: 'ok' });
    const res = await toggleFavoriteApi('tok', 't1');
    expect(res.isFavorite).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/users/favorites/t1`);
  });
});

describe('trackService', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetchTracks arma la query con todos los filtros', async () => {
    const fetchMock = mockFetch([]);
    await fetchTracks({
      genre: 'Trap',
      search: 'dark',
      maxPrice: 20,
      sort: 'price_asc',
      producerId: 'u1',
    });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/tracks');
    expect(url.searchParams.get('genre')).toBe('Trap');
    expect(url.searchParams.get('search')).toBe('dark');
    expect(url.searchParams.get('maxPrice')).toBe('20');
    expect(url.searchParams.get('sort')).toBe('price_asc');
    expect(url.searchParams.get('producerId')).toBe('u1');
  });

  it('fetchTracks sin filtros no agrega query', async () => {
    const fetchMock = mockFetch([]);
    await fetchTracks();
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/tracks`);
  });

  it('fetchTracks acepta un género como texto', async () => {
    const fetchMock = mockFetch([]);
    await fetchTracks('Drill');
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/tracks?genre=Drill`);
  });

  it('updateTrackApi hace PATCH con token', async () => {
    const fetchMock = mockFetch({ id: 't1', price: 12 });
    await updateTrackApi('tok', 't1', { price: 12 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/tracks/t1`);
    expect(init.method).toBe('PATCH');
    expect(init.headers.Authorization).toBe('Bearer tok');
  });

  it('updateTrackApi lanza el error de validación', async () => {
    mockFetch({ message: ['price must not be less than 0'] }, false);
    await expect(updateTrackApi('tok', 't1', { price: -1 })).rejects.toThrow(
      'price must not be less than 0',
    );
  });

  it('registerPlayApi no lanza error aunque falle la red', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    expect(() => registerPlayApi('t1')).not.toThrow();
  });

  it('uploadBeat envía el token en la cabecera Authorization', async () => {
    const instances: FakeXhr[] = [];
    class FakeXhr {
      headers: Record<string, string> = {};
      upload = { onprogress: null as null | ((e: unknown) => void) };
      status = 201;
      responseText = JSON.stringify({ id: 'nuevo' });
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      open = vi.fn();
      setRequestHeader = (k: string, v: string) => {
        this.headers[k] = v;
      };
      send = () => this.onload?.();
      constructor() {
        instances.push(this);
      }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXhr);

    const res = await uploadBeat(new FormData(), 'mi-token');
    expect(res).toEqual({ id: 'nuevo' });
    expect(instances[0].open).toHaveBeenCalledWith('POST', `${API}/tracks`);
    expect(instances[0].headers.Authorization).toBe('Bearer mi-token');
  });

  it('uploadBeat rechaza con el mensaje del servidor', async () => {
    class FakeXhr {
      upload = {};
      status = 403;
      responseText = JSON.stringify({ message: 'Acceso denegado.' });
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      open = vi.fn();
      setRequestHeader = vi.fn();
      send = () => this.onload?.();
    }
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    await expect(uploadBeat(new FormData(), 'tok')).rejects.toThrow('Acceso denegado.');
  });
});

describe('adminService', () => {
  it('updateAdminUser envía verified y role', async () => {
    const fetchMock = mockFetch({ id: 'u1' });
    await updateAdminUser('tok', 'u1', { verified: true, role: 'PRODUCER' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/users/u1`);
    expect(JSON.parse(init.body)).toEqual({ verified: true, role: 'PRODUCER' });
  });

  it('deleteTrackApi usa DELETE con token', async () => {
    const fetchMock = mockFetch({ success: true });
    await deleteTrackApi('tok', 't9');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/tracks/t9`);
    expect(init.method).toBe('DELETE');
    expect(init.headers.Authorization).toBe('Bearer tok');
  });

  it('deleteTrackApi lanza el 403 del backend', async () => {
    mockFetch({ message: 'No puedes eliminar un beat que no es tuyo.' }, false, 403);
    await expect(deleteTrackApi('tok', 't9')).rejects.toThrow(
      'No puedes eliminar un beat que no es tuyo.',
    );
  });
});
