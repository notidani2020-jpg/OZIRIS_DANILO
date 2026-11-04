import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---- mocks compartidos -------------------------------------------------
const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const authState = {
  isAuthenticated: true,
  isAdmin: false,
  isLoading: false,
  token: 'tok' as string | null,
};
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}));

const showToast = vi.fn();
vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ showToast }),
}));

const updateTrackApi = vi.fn();
const deleteTrackApi = vi.fn();
vi.mock('@/services/api', () => ({
  updateTrackApi: (...a: unknown[]) => updateTrackApi(...a),
  deleteTrackApi: (...a: unknown[]) => deleteTrackApi(...a),
}));

import ProtectedRoute from './auth/ProtectedRoute';
import EditBeatModal from './tracks/EditBeatModal';
import { AdminUsersTab } from './admin/AdminUsersTab';
import TrackCard from './inicio/TrackCard';
import type { Track, User } from '@/types';

const track: Track = {
  id: 't1',
  title: 'Dark Night',
  description: 'Beat oscuro',
  price: 25,
  genre: 'Trap',
  bpm: 140,
  key: 'Am',
  tags: ['dark', '808'],
  audioUrl: '/a.mp3',
  producerId: 'p1',
  producer: { id: 'p1', name: 'Juan', email: 'j@x.co', artistName: 'JB Beats' },
};

beforeEach(() => {
  push.mockClear();
  showToast.mockClear();
  updateTrackApi.mockReset();
  deleteTrackApi.mockReset();
  Object.assign(authState, {
    isAuthenticated: true,
    isAdmin: false,
    isLoading: false,
    token: 'tok',
  });
});

describe('ProtectedRoute', () => {
  it('muestra el contenido a un usuario autenticado', () => {
    render(
      <ProtectedRoute>
        <p>contenido privado</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText('contenido privado')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('redirige a /login si no hay sesión', async () => {
    authState.isAuthenticated = false;
    render(
      <ProtectedRoute>
        <p>contenido privado</p>
      </ProtectedRoute>,
    );
    expect(screen.queryByText('contenido privado')).not.toBeInTheDocument();
    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
  });

  it('muestra "verificando" mientras carga la sesión', () => {
    authState.isLoading = true;
    render(
      <ProtectedRoute>
        <p>contenido privado</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText(/Verificando sesión/)).toBeInTheDocument();
  });

  it('bloquea a un no-admin en rutas adminOnly', () => {
    render(
      <ProtectedRoute adminOnly>
        <p>panel</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.queryByText('panel')).not.toBeInTheDocument();
  });

  it('deja pasar a un admin en rutas adminOnly', () => {
    authState.isAdmin = true;
    render(
      <ProtectedRoute adminOnly>
        <p>panel</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText('panel')).toBeInTheDocument();
  });
});

describe('EditBeatModal', () => {
  const setup = () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const onDeleted = vi.fn();
    render(<EditBeatModal track={track} onClose={onClose} onSaved={onSaved} onDeleted={onDeleted} />);
    return { onClose, onSaved, onDeleted };
  };

  it('precarga los datos del beat', () => {
    setup();
    expect(screen.getByDisplayValue('Dark Night')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('140')).toBeInTheDocument();
    expect(screen.getByDisplayValue('dark, 808')).toBeInTheDocument();
  });

  it('guarda los cambios llamando a la API con el formato correcto', async () => {
    const user = userEvent.setup();
    updateTrackApi.mockResolvedValue({ ...track, price: 30 });
    const { onSaved } = setup();

    const price = screen.getByDisplayValue('25');
    await user.clear(price);
    await user.type(price, '30');
    const tags = screen.getByDisplayValue('dark, 808');
    await user.clear(tags);
    await user.type(tags, ' trap ,  , melodic');
    await user.click(screen.getByRole('button', { name: /Guardar/ }));

    await waitFor(() => expect(updateTrackApi).toHaveBeenCalled());
    const [token, id, payload] = updateTrackApi.mock.calls[0];
    expect(token).toBe('tok');
    expect(id).toBe('t1');
    expect(payload.price).toBe(30);
    expect(payload.bpm).toBe(140);
    expect(payload.tags).toEqual(['trap', 'melodic']);
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(showToast).toHaveBeenCalledWith('success', 'Beat actualizado.');
  });

  it('un BPM fuera de rango no llega a la API (validación nativa del campo)', async () => {
    const user = userEvent.setup();
    setup();
    const bpm = screen.getByDisplayValue('140');
    await user.clear(bpm);
    await user.type(bpm, '999');
    expect(bpm).toBeInvalid();
    await user.click(screen.getByRole('button', { name: /Guardar/ }));
    expect(updateTrackApi).not.toHaveBeenCalled();
  });

  it('valida que el título no quede vacío', async () => {
    const user = userEvent.setup();
    setup();
    const title = screen.getByDisplayValue('Dark Night');
    await user.clear(title);
    await user.type(title, '   ');
    await user.click(screen.getByRole('button', { name: /Guardar/ }));
    expect(screen.getByRole('alert')).toHaveTextContent(/título/i);
    expect(updateTrackApi).not.toHaveBeenCalled();
  });

  it('muestra el error del servidor y no cierra el modal', async () => {
    const user = userEvent.setup();
    updateTrackApi.mockRejectedValue(new Error('No puedes editar un beat que no es tuyo.'));
    const { onSaved } = setup();
    await user.click(screen.getByRole('button', { name: /Guardar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No puedes editar un beat que no es tuyo.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('pide confirmación antes de eliminar', async () => {
    const user = userEvent.setup();
    deleteTrackApi.mockResolvedValue({ success: true });
    const { onDeleted } = setup();

    await user.click(screen.getByRole('button', { name: /Eliminar beat/ }));
    expect(deleteTrackApi).not.toHaveBeenCalled();
    expect(screen.getByText(/Eliminar definitivamente/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Sí, eliminar/ }));
    await waitFor(() => expect(deleteTrackApi).toHaveBeenCalledWith('tok', 't1'));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('t1'));
  });

  it('cancelar la eliminación no borra nada', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Eliminar beat/ }));
    await user.click(screen.getByRole('button', { name: 'No' }));
    expect(deleteTrackApi).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Eliminar beat/ })).toBeInTheDocument();
  });
});

describe('AdminUsersTab', () => {
  const users: User[] = [
    { id: 'admin1', name: 'Yo Admin', email: 'admin@x.co', role: 'ADMIN', isActive: true, createdAt: '2026-01-01' },
    {
      id: 'prod1',
      name: 'Pro Ductor',
      email: 'p@x.co',
      role: 'PRODUCER',
      isActive: true,
      artist: { id: 'a1', artisticName: 'PD', verified: false, createdAt: '2026-01-01' },
    },
    { id: 'user1', name: 'Cliente', email: 'c@x.co', role: 'USER', isActive: false },
  ];

  const setup = () => {
    const props = {
      users,
      userSearch: '',
      setUserSearch: vi.fn(),
      isLoadingUsers: false,
      onToggleStatus: vi.fn(),
      onChangeRole: vi.fn(),
      onToggleVerified: vi.fn(),
      onSelectUserToDelete: vi.fn(),
      currentUserId: 'admin1',
    };
    render(<AdminUsersTab {...props} />);
    return props;
  };

  const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

  it('lista a los usuarios', () => {
    setup();
    expect(screen.getByText('Mostrando 3 usuarios')).toBeInTheDocument();
  });

  it('el admin no puede cambiar su propio rol, estado ni borrarse', () => {
    setup();
    const row = rowOf('Yo Admin');
    expect(within(row).getByRole('combobox')).toBeDisabled();
    expect(within(row).getByTitle('Eliminar usuario')).toBeDisabled();
    expect(within(row).getByTitle('Desactivar usuario')).toBeDisabled();
  });

  it('cambiar el rol de otro usuario llama a onChangeRole', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.selectOptions(within(rowOf('Cliente')).getByRole('combobox'), 'PRODUCER');
    expect(props.onChangeRole).toHaveBeenCalledWith(users[2], 'PRODUCER');
  });

  it('solo los productores tienen botón de verificación', async () => {
    const user = userEvent.setup();
    const props = setup();
    expect(within(rowOf('Cliente')).queryByTitle(/erific/)).not.toBeInTheDocument();
    await user.click(within(rowOf('Pro Ductor')).getByTitle('Verificar artista'));
    expect(props.onToggleVerified).toHaveBeenCalledWith(users[1]);
  });

  it('eliminar a otro usuario abre la confirmación', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(within(rowOf('Cliente')).getByTitle('Eliminar usuario'));
    expect(props.onSelectUserToDelete).toHaveBeenCalledWith(users[2]);
  });
});

describe('TrackCard', () => {
  const baseProps = {
    track,
    isPlaying: false,
    onPlay: vi.fn(),
    onSelectGenre: vi.fn(),
    onSelectTag: vi.fn(),
    isFavorite: false,
    onToggleFavorite: vi.fn(),
    isPurchased: false,
    isDownloading: false,
    onDownload: vi.fn(),
    onBuy: vi.fn(),
    isInCart: false,
  };

  it('el nombre del productor enlaza a su perfil público', () => {
    render(<TrackCard {...baseProps} />);
    const link = screen.getByRole('link', { name: 'JB Beats' });
    expect(link).toHaveAttribute('href', '/artista/p1');
  });

  it('muestra el botón de compra con el precio y dispara onBuy', async () => {
    const user = userEvent.setup();
    const onBuy = vi.fn();
    render(<TrackCard {...baseProps} onBuy={onBuy} />);
    await user.click(screen.getByTitle('Comprar beat'));
    expect(onBuy).toHaveBeenCalledWith(track);
    expect(screen.getByTitle('Comprar beat')).toHaveTextContent('$25.00');
  });

  it('si ya está comprado muestra Descargar en lugar de comprar', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    render(<TrackCard {...baseProps} isPurchased onDownload={onDownload} />);
    expect(screen.queryByTitle('Comprar beat')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Descargar/ }));
    expect(onDownload).toHaveBeenCalledWith(track);
  });

  it('los chips de género y etiqueta disparan los filtros', async () => {
    const user = userEvent.setup();
    const onSelectGenre = vi.fn();
    const onSelectTag = vi.fn();
    render(<TrackCard {...baseProps} onSelectGenre={onSelectGenre} onSelectTag={onSelectTag} />);
    await user.click(screen.getByRole('button', { name: 'Trap' }));
    await user.click(screen.getByRole('button', { name: '#dark' }));
    expect(onSelectGenre).toHaveBeenCalledWith('Trap');
    expect(onSelectTag).toHaveBeenCalledWith('dark');
  });

  it('el corazón alterna favoritos', async () => {
    const user = userEvent.setup();
    const onToggleFavorite = vi.fn();
    render(<TrackCard {...baseProps} onToggleFavorite={onToggleFavorite} />);
    await user.click(screen.getByTitle('Guardar en favoritos'));
    expect(onToggleFavorite).toHaveBeenCalledWith(track);
  });
});
