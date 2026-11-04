import { API_URL } from './config';
import { User } from '@/types';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  accountType?: 'USER' | 'ARTIST';
  artisticName?: string;
  genre?: string;
}

export async function registerApi(
  dataOrName: string | RegisterData,
  email?: string,
  password?: string,
) {
  const payload =
    typeof dataOrName === 'string'
      ? { name: dataOrName, email, password, accountType: 'USER' }
      : dataOrName;

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error en el registro de usuario.');
  }
  return data;
}

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Credenciales incorrectas o problema de inicio de sesión.');
  }
  return data;
}

export async function getProfileApi(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error al obtener el perfil de usuario.');
  }
  return data;
}

export async function forgotPasswordApi(email: string): Promise<{ message: string; email?: string }> {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error al solicitar el código de recuperación.');
  }
  return data;
}

export async function verifyResetCodeApi(email: string, code: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/verify-reset-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Código incorrecto o expirado.');
  }
  return data;
}

export async function resetPasswordApi(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error al restablecer la contraseña.');
  }
  return data;
}


export async function changePasswordApi(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(' ') : data.message;
    throw new Error(msg || 'Error al cambiar la contraseña.');
  }
  return data;
}
