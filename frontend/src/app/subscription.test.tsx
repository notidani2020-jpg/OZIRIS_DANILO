import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  plan: 'pro',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(`plan=${navigation.plan}`),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Ana', lastName: 'López', email: 'ana@example.com', role: 'USER' },
    isLoading: false,
  }),
}));

import PricingPage from './planes/page';
import SubscriptionPage from './suscribirse/page';

describe('flujo de suscripción', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.replace.mockReset();
    navigation.plan = 'pro';
  });

  it('envía cada botón del plan a su checkout correspondiente', async () => {
    render(<PricingPage />);

    const buttons = screen.getAllByRole('button', { name: 'Suscríbete ahora' });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);

    expect(navigation.push.mock.calls).toEqual([
      ['/suscribirse?plan=basico'],
      ['/suscribirse?plan=pro'],
      ['/suscribirse?plan=ilimitado'],
    ]);
  });

  it('autocompleta al usuario y muestra la confirmación de demostración', async () => {
    render(<SubscriptionPage />);

    expect(await screen.findByRole('heading', { name: 'Plus' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Ana López');
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@example.com');
    expect(screen.getByText('Prueba gratis de 7 días')).toBeInTheDocument();
    expect(screen.getByText('Total a pagar hoy').parentElement).toHaveTextContent('$0.00');

    fireEvent.change(screen.getByLabelText('Documento / NIT'), { target: { value: '123456789' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '3001234567' } });
    fireEvent.submit(screen.getByRole('button', { name: /Iniciar prueba gratis/ }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Solicitud lista' })).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText(/No se procesó ningún cargo/)).toBeInTheDocument();
    expect(screen.getByText('Beats ilimitados')).toBeInTheDocument();
  });
});