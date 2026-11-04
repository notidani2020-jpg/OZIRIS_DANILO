import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

import { AuthProvider, useAuth } from './AuthContext';
import { CartProvider, useCart } from './CartContext';
import { ToastProvider, useToast } from './ToastContext';
import type { Track, User } from '@/types';

const baseUser: User = {
  id: 'u1',
  name: 'Ana',
  email: 'ana@oziris.test',
  role: 'USER',
};

const authWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => push.mockClear());

  it('arranca sin sesión', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login guarda la sesión y la persiste en localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.login('tok', baseUser));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('tok');
    expect(localStorage.getItem('oziris_auth_token')).toBe('tok');
    expect(JSON.parse(localStorage.getItem('oziris_auth_user')!).email).toBe('ana@oziris.test');
  });

  it('restaura la sesión guardada al montar', async () => {
    localStorage.setItem('oziris_auth_token', 'guardado');
    localStorage.setItem('oziris_auth_user', JSON.stringify(baseUser));
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.name).toBe('Ana');
  });

  it('ignora una sesión guardada corrupta', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('oziris_auth_token', 'x');
    localStorage.setItem('oziris_auth_user', '{no es json');
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('oziris_auth_token')).toBeNull();
  });

  it('logout borra la sesión y redirige al login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.login('tok', baseUser));
    act(() => result.current.logout());

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('oziris_auth_token')).toBeNull();
    expect(push).toHaveBeenCalledWith('/login');
  });

  it('updateCurrentUser fusiona los datos y los guarda', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.login('tok', baseUser));
    act(() => result.current.updateCurrentUser({ name: 'Ana María', location: 'Cali' }));

    expect(result.current.user?.name).toBe('Ana María');
    expect(result.current.user?.email).toBe('ana@oziris.test');
    expect(JSON.parse(localStorage.getItem('oziris_auth_user')!).location).toBe('Cali');
  });

  it('calcula isAdmin e isArtist según el rol', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.login('t', { ...baseUser, role: 'PRODUCER' }));
    expect(result.current.isArtist).toBe(true);
    expect(result.current.isAdmin).toBe(false);

    act(() => result.current.login('t', { ...baseUser, role: 'ADMIN' }));
    expect(result.current.isAdmin).toBe(true);

    act(() => result.current.login('t', baseUser));
    expect(result.current.isArtist).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it('useAuth fuera del provider lanza un error claro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });
});

describe('CartContext', () => {
  const cartWrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );
  const track = (id: string, price: number): Track => ({
    id,
    title: `Beat ${id}`,
    price,
    audioUrl: '/a.mp3',
    producerId: 'p1',
  });

  it('agrega beats, evita duplicados y suma el total', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: cartWrapper });
    act(() => result.current.addToCart(track('a', 10)));
    act(() => result.current.addToCart(track('a', 10)));
    act(() => result.current.addToCart(track('b', 5.5)));

    expect(result.current.cartCount).toBe(2);
    expect(result.current.totalPrice).toBeCloseTo(15.5);
    expect(result.current.isInCart('a')).toBe(true);
    expect(result.current.isCartOpen).toBe(true);
  });

  it('quita beats y vacía el carrito', () => {
    const { result } = renderHook(() => useCart(), { wrapper: cartWrapper });
    act(() => result.current.addToCart(track('a', 10)));
    act(() => result.current.addToCart(track('b', 5)));
    act(() => result.current.removeFromCart('a'));
    expect(result.current.cartItems.map((t) => t.id)).toEqual(['b']);
    act(() => result.current.clearCart());
    expect(result.current.cartCount).toBe(0);
  });

  it('persiste el carrito en localStorage y lo recupera', async () => {
    const first = renderHook(() => useCart(), { wrapper: cartWrapper });
    act(() => first.result.current.addToCart(track('a', 10)));
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem('oziris_cart_v1')!)).toHaveLength(1),
    );
    first.unmount();

    const second = renderHook(() => useCart(), { wrapper: cartWrapper });
    await waitFor(() => expect(second.result.current.cartCount).toBe(1));
  });
});

describe('ToastContext', () => {
  function Demo() {
    const { showToast } = useToast();
    return (
      <>
        <button onClick={() => showToast('success', 'Guardado')}>ok</button>
        <button onClick={() => showToast('error', 'Falló')}>mal</button>
      </>
    );
  }

  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('muestra el aviso y lo cierra solo a los 5 segundos', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    await user.click(screen.getByText('ok'));
    expect(screen.getByText('Guardado')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(screen.queryByText('Guardado')).not.toBeInTheDocument();
  });

  it('se puede cerrar manualmente', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    await user.click(screen.getByText('mal'));
    await user.click(screen.getByLabelText('Cerrar notificación'));
    expect(screen.queryByText('Falló')).not.toBeInTheDocument();
  });

  it('mantiene como máximo 4 avisos a la vez', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    for (let i = 0; i < 6; i++) await user.click(screen.getByText('ok'));
    expect(screen.getAllByText('Guardado')).toHaveLength(4);
  });

  it('useToast fuera del provider lanza un error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/);
  });
});
