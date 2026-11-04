import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PublicArtist, Track, User } from '@/types';

// ---- mocks -------------------------------------------------------------
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const authState: {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isArtist: boolean;
  isLoading: boolean;
  updateCurrentUser: ReturnType<typeof vi.fn>;
} = {
  user: null,
  token: 'tok',
  isAuthenticated: true,
  isAdmin: false,
  isArtist: false,
  isLoading: false,
  updateCurrentUser: vi.fn(),
};
vi.mock('@/context/AuthContext', () => ({ useAuth: () => authState }));

const showToast = vi.fn();
vi.mock('@/context/ToastContext', () => ({ useToast: () => ({ showToast }) }));

const playTrack = vi.fn();
vi.mock('@/context/PlayerContext', () => ({
  usePlayer: () => ({ currentTrack: null, isPlaying: false, playTrack }),
}));

const toggleFavorite = vi.fn();
vi.mock('@/context/FavoritesContext', () => ({
  useFavorites: () => ({ isFavorite: () => false, toggleFavorite }),
}));

vi.mock('@/components/checkout/PaymentSimulationModal', () => ({
  default: ({ isOpen, track }: { isOpen: boolean; track?: Track | null }) =>
    isOpen ? <div data-testid="payment-modal">Pagando {track?.title}</div> : null,
}));

const api = vi.hoisted(() => ({
  updateProfileApi: vi.fn(),
  uploadAvatarApi: vi.fn(),
  uploadBannerApi: vi.fn(),
  changePasswordApi: vi.fn(),
  fetchPublicArtistApi: vi.fn(),
  fetchTracks: vi.fn(),
  fetchMyPurchasesApi: vi.fn(),
  downloadBeatFile: vi.fn(),
  updateTrackApi: vi.fn(),
  deleteTrackApi: vi.fn(),
}));
vi.mock('@/services/api', () => api);

import PerfilPage from './perfil/page';
import ArtistPage from './artista/[id]/page';

// ---- datos -------------------------------------------------------------
const artistUser: User = {
  id: 'p1',
  name: 'Juan',
  lastName: 'Pérez',
  email: 'juan@oziris.test',
  role: 'PRODUCER',
  artistName: 'JB Beats',
  bio: 'Productor de trap',
  location: 'Cali',
  artist: {
    id: 'a1',
    artisticName: 'JB Beats',
    genre: 'Trap',
    spotifyUrl: 'https://open.spotify.com/artist/x',
    verified: true,
    createdAt: '2026-01-01',
  },
};
const normalUser: User = { id: 'u1', name: 'Ana', email: 'ana@x.co', role: 'USER' };
const adminUser: User = { id: 'ad1', name: 'Root', email: 'root@x.co', role: 'ADMIN' };

function setAuth(user: User | null, extra: Partial<typeof authState> = {}) {
  Object.assign(authState, {
    user,
    token: 'tok',
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isArtist: user?.role === 'PRODUCER' || user?.role === 'ADMIN' || !!user?.artist,
    isLoading: false,
    ...extra,
  });
}

beforeEach(() => {
  Object.values(api).forEach((m) => m.mockReset());
  authState.updateCurrentUser = vi.fn();
  showToast.mockClear();
  playTrack.mockClear();
  toggleFavorite.mockClear();
  api.fetchMyPurchasesApi.mockResolvedValue([]);
});

// ========================================================================
describe('Página /perfil', () => {
  it('un artista ve los campos de artista y redes', () => {
    setAuth(artistUser);
    render(<PerfilPage />);
    expect(screen.getByText('Identidad artística')).toBeInTheDocument();
    expect(screen.getByText('Redes y plataformas')).toBeInTheDocument();
    expect(screen.getByDisplayValue('JB Beats')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://open.spotify.com/artist/x')).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver mi perfil público/ })).toHaveAttribute(
      'href',
      '/artista/p1',
    );
  });

  it('un cliente solo ve los campos básicos', () => {
    setAuth(normalUser);
    render(<PerfilPage />);
    expect(screen.queryByText('Identidad artística')).not.toBeInTheDocument();
    expect(screen.queryByText('Redes y plataformas')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /perfil público/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Cuenta de Oyente/)).toBeInTheDocument();
  });

  it('un administrador NO ve campos ni enlace de artista', () => {
    setAuth(adminUser);
    render(<PerfilPage />);
    expect(screen.queryByText('Identidad artística')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /perfil público/ })).not.toBeInTheDocument();
    expect(screen.getByText('ADMINISTRADOR')).toBeInTheDocument();
  });

  it('guarda el perfil de artista con los campos de artista', async () => {
    setAuth(artistUser);
    const updated = { ...artistUser, location: 'Bogotá' };
    api.updateProfileApi.mockResolvedValue(updated);
    const user = userEvent.setup();
    render(<PerfilPage />);

    const loc = screen.getByDisplayValue('Cali');
    await user.clear(loc);
    await user.type(loc, 'Bogotá');
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/ }));

    await waitFor(() => expect(api.updateProfileApi).toHaveBeenCalled());
    const [token, payload] = api.updateProfileApi.mock.calls[0];
    expect(token).toBe('tok');
    expect(payload).toMatchObject({
      name: 'Juan',
      location: 'Bogotá',
      artistName: 'JB Beats',
      genre: 'Trap',
      spotifyUrl: 'https://open.spotify.com/artist/x',
    });
    await waitFor(() =>
      expect(authState.updateCurrentUser).toHaveBeenCalledWith(
        expect.objectContaining({ location: 'Bogotá', artist: updated.artist }),
      ),
    );
    expect(await screen.findByText('¡Perfil guardado con éxito!')).toBeInTheDocument();
  });

  it('un cliente no envía campos de artista al guardar', async () => {
    setAuth(normalUser);
    api.updateProfileApi.mockResolvedValue(normalUser);
    const user = userEvent.setup();
    render(<PerfilPage />);
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/ }));
    await waitFor(() => expect(api.updateProfileApi).toHaveBeenCalled());
    const payload = api.updateProfileApi.mock.calls[0][1];
    expect(payload).not.toHaveProperty('genre');
    expect(payload).not.toHaveProperty('spotifyUrl');
    expect(payload).not.toHaveProperty('artistName');
  });

  it('bloquea el guardado si una URL de red es inválida', async () => {
    setAuth(artistUser);
    const user = userEvent.setup();
    render(<PerfilPage />);
    const spotify = screen.getByDisplayValue('https://open.spotify.com/artist/x');
    await user.clear(spotify);
    await user.type(spotify, 'javascript:alert(1)');
    expect(screen.getByText('Ingresa una URL válida (https://...)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar Cambios/ })).toBeDisabled();
  });

  it('muestra el error del servidor al fallar el guardado', async () => {
    setAuth(normalUser);
    api.updateProfileApi.mockRejectedValue(new Error('Error del servidor'));
    const user = userEvent.setup();
    render(<PerfilPage />);
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/ }));
    expect(await screen.findByText('Error del servidor')).toBeInTheDocument();
  });

  describe('cambio de contraseña', () => {
    const fill = async (
      user: ReturnType<typeof userEvent.setup>,
      cur: string,
      nw: string,
      conf: string,
    ) => {
      const inputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
      await user.type(inputs[0], cur);
      await user.type(inputs[1], nw);
      await user.type(inputs[2], conf);
    };
    const changeBtn = () => screen.getByRole('button', { name: 'Cambiar contraseña' });

    it('el botón está deshabilitado hasta que los datos sean válidos', async () => {
      setAuth(normalUser);
      const user = userEvent.setup();
      render(<PerfilPage />);
      expect(changeBtn()).toBeDisabled();
      await fill(user, 'actual123', 'nueva456', 'otra');
      expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
      expect(changeBtn()).toBeDisabled();
    });

    it('rechaza una nueva contraseña de menos de 6 caracteres', async () => {
      setAuth(normalUser);
      const user = userEvent.setup();
      render(<PerfilPage />);
      await fill(user, 'actual123', '123', '123');
      expect(screen.getByText(/al menos 6 caracteres/)).toBeInTheDocument();
      expect(changeBtn()).toBeDisabled();
    });

    it('cambia la contraseña y limpia los campos', async () => {
      setAuth(normalUser);
      api.changePasswordApi.mockResolvedValue({ message: 'Contraseña actualizada correctamente.' });
      const user = userEvent.setup();
      render(<PerfilPage />);
      await fill(user, 'actual123', 'nueva456', 'nueva456');
      await user.click(changeBtn());

      await waitFor(() =>
        expect(api.changePasswordApi).toHaveBeenCalledWith('tok', 'actual123', 'nueva456'),
      );
      expect(await screen.findByText('Contraseña actualizada correctamente.')).toBeInTheDocument();
      document
        .querySelectorAll<HTMLInputElement>('input[type="password"]')
        .forEach((i) => expect(i.value).toBe(''));
    });

    it('muestra el error cuando la contraseña actual es incorrecta', async () => {
      setAuth(normalUser);
      api.changePasswordApi.mockRejectedValue(new Error('La contraseña actual es incorrecta.'));
      const user = userEvent.setup();
      render(<PerfilPage />);
      await fill(user, 'mala', 'nueva456', 'nueva456');
      await user.click(changeBtn());
      expect(await screen.findByText('La contraseña actual es incorrecta.')).toBeInTheDocument();
    });

    it('Enter en un campo de contraseña no envía el perfil completo', async () => {
      setAuth(normalUser);
      const user = userEvent.setup();
      render(<PerfilPage />);
      const inputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
      await user.type(inputs[0], 'x{Enter}');
      expect(api.updateProfileApi).not.toHaveBeenCalled();
    });
  });
});

// ========================================================================
describe('Página /artista/[id]', () => {
  const artist: PublicArtist = {
    id: 'p1',
    name: 'Juan',
    artistName: 'JB Beats',
    avatarUrl: null,
    location: 'Cali, Colombia',
    bio: 'Productor de trap desde 2018.',
    genre: 'Trap',
    bannerUrl: null,
    spotifyUrl: 'https://open.spotify.com/artist/x',
    instagramUrl: 'javascript:alert(1)',
    youtubeUrl: null,
    verified: true,
    tracksCount: 2,
    totalPlays: 1500,
    memberSince: '2026-01-15T00:00:00.000Z',
  };
  const tracks: Track[] = [
    { id: 't1', title: 'Dark Night', price: 25, genre: 'Trap', bpm: 140, audioUrl: '/a.mp3', producerId: 'p1', playsCount: 10 },
    { id: 't2', title: 'Sunrise', price: 15, audioUrl: '/b.mp3', producerId: 'p1' },
  ];

  const renderPage = async (id = 'p1') => {
    await act(async () => {
      render(
        <Suspense fallback={<p>cargando</p>}>
          <ArtistPage params={Promise.resolve({ id })} />
        </Suspense>,
      );
    });
  };

  beforeEach(() => {
    api.fetchPublicArtistApi.mockResolvedValue(artist);
    api.fetchTracks.mockResolvedValue(tracks);
  });

  it('muestra el perfil, las estadísticas y los beats del artista', async () => {
    setAuth(normalUser);
    await renderPage();
    expect(await screen.findByRole('heading', { name: 'JB Beats' })).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText('Cali, Colombia')).toBeInTheDocument();
    expect(screen.getByText('Productor de trap desde 2018.')).toBeInTheDocument();
    expect(screen.getByText('Dark Night')).toBeInTheDocument();
    expect(screen.getByText('Sunrise')).toBeInTheDocument();
    expect(api.fetchTracks).toHaveBeenCalledWith({ producerId: 'p1', sort: 'newest' });
    expect(api.fetchPublicArtistApi).toHaveBeenCalledWith('p1');
  });

  it('solo muestra enlaces de redes con protocolo http/https', async () => {
    setAuth(normalUser);
    await renderPage();
    await screen.findByRole('heading', { name: 'JB Beats' });
    const spotify = screen.getByLabelText('Spotify');
    expect(spotify).toHaveAttribute('href', 'https://open.spotify.com/artist/x');
    expect(spotify).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('YouTube')).not.toBeInTheDocument();
  });

  it('muestra un error claro si el artista no existe', async () => {
    setAuth(normalUser);
    api.fetchPublicArtistApi.mockRejectedValue(new Error('Artista no encontrado.'));
    await renderPage('zzz');
    expect(await screen.findByText('Artista no encontrado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument();
  });

  it('muestra un mensaje cuando el artista no tiene beats', async () => {
    setAuth(normalUser);
    api.fetchTracks.mockResolvedValue([]);
    await renderPage();
    expect(await screen.findByText(/aún no ha publicado beats/)).toBeInTheDocument();
  });

  it('un visitante ve comprar, no editar; reproduce con la lista del artista', async () => {
    setAuth(normalUser);
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText('Dark Night');
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();

    const row = screen.getByText('Dark Night').closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Reproducir' }));
    expect(playTrack).toHaveBeenCalledWith(tracks[0], tracks);

    await user.click(within(row).getByRole('button', { name: /\$25\.00/ }));
    expect(screen.getByTestId('payment-modal')).toHaveTextContent('Pagando Dark Night');
  });

  it('un visitante sin sesión recibe un aviso en vez de comprar', async () => {
    setAuth(null);
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText('Dark Night');
    const row = screen.getByText('Dark Night').closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /\$25\.00/ }));
    expect(showToast).toHaveBeenCalledWith('info', expect.stringMatching(/Inicia sesión/));
    expect(screen.queryByTestId('payment-modal')).not.toBeInTheDocument();
  });

  it('un administrador no puede comprar', async () => {
    setAuth(adminUser);
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText('Dark Night');
    const row = screen.getByText('Dark Night').closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /\$25\.00/ }));
    expect(showToast).toHaveBeenCalledWith('info', expect.stringMatching(/administrador/i));
    expect(screen.queryByTestId('payment-modal')).not.toBeInTheDocument();
  });

  it('si ya compró el beat muestra Descargar', async () => {
    setAuth(normalUser);
    api.fetchMyPurchasesApi.mockResolvedValue([{ id: 'c1', status: 'COMPLETED', trackId: 't1', amount: 25, createdAt: '' }]);
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText('Dark Night');
    const row = screen.getByText('Dark Night').closest('li') as HTMLElement;
    const download = await within(row).findByRole('button', { name: /Descargar/ });
    await user.click(download);
    await waitFor(() => expect(api.downloadBeatFile).toHaveBeenCalledWith('tok', 't1', 'Dark Night'));
    // el otro beat no comprado sigue ofreciendo compra
    const row2 = screen.getByText('Sunrise').closest('li') as HTMLElement;
    expect(within(row2).getByRole('button', { name: /\$15\.00/ })).toBeInTheDocument();
  });

  it('el dueño ve "Editar" en sus beats y no botones de compra', async () => {
    setAuth(artistUser);
    await renderPage();
    await screen.findByText('Dark Night');
    expect(screen.getAllByRole('button', { name: /Editar/ })).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Editar perfil/ })).toHaveAttribute('href', '/perfil');
    expect(screen.queryByRole('button', { name: /\$25\.00/ })).not.toBeInTheDocument();
  });

  it('el dueño edita un beat y la lista se actualiza', async () => {
    setAuth(artistUser);
    api.updateTrackApi.mockResolvedValue({ ...tracks[0], title: 'Dark Night II', price: 30 });
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText('Dark Night');

    const row = screen.getByText('Dark Night').closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /Editar/ }));
    const title = screen.getByDisplayValue('Dark Night');
    await user.clear(title);
    await user.type(title, 'Dark Night II');
    await user.click(screen.getByRole('button', { name: /Guardar/ }));

    expect(await screen.findByText('Dark Night II')).toBeInTheDocument();
    expect(screen.queryByText('Editar Beat')).not.toBeInTheDocument();
  });

  it('el dueño elimina un beat y baja el contador', async () => {
    setAuth(artistUser);
    api.deleteTrackApi.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    await renderPage();
    await screen.findByText('Dark Night');

    const row = screen.getByText('Sunrise').closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /Editar/ }));
    await user.click(screen.getByRole('button', { name: /Eliminar beat/ }));
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/ }));

    await waitFor(() => expect(screen.queryByText('Sunrise')).not.toBeInTheDocument());
    expect(screen.getByText('Dark Night')).toBeInTheDocument();
  });
});
