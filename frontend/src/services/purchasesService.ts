import { apiMessage } from './http';
import { API_URL } from './config';
import { Purchase, PaymentSimulationResponse } from '@/types';

export interface SimulatePaymentPayload {
  trackId?: string;
  trackIds?: string[];
  paymentMethod?: string;
  licenseType?: string;
  amount?: number;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  payerDocument?: string;
  bankName?: string;
  personType?: string;
  cardHolder?: string;
  cardLastFour?: string;
  phoneNumber?: string;
  metadata?: any;
}

/**
 * Simula un pago para adquirir un beat o paquete de beats.
 */
export async function simulatePaymentApi(
  token: string,
  payload: SimulatePaymentPayload,
): Promise<PaymentSimulationResponse> {
  const res = await fetch(`${API_URL}/purchases/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(apiMessage(data.message, 'Error al procesar la simulación de pago.'));
  }

  return data;
}

/**
 * Obtiene todas las compras registradas del usuario autenticado.
 */
export async function fetchMyPurchasesApi(token: string): Promise<Purchase[]> {
  try {
    const res = await fetch(`${API_URL}/purchases/my-purchases`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Verifica si el usuario actual ya compró un beat específico.
 */
export async function checkPurchaseStatusApi(
  token: string,
  trackId: string,
): Promise<{ purchased: boolean; transactionId?: string; downloadUrl?: string }> {
  try {
    const res = await fetch(`${API_URL}/purchases/check/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return { purchased: false };
    return await res.json();
  } catch {
    return { purchased: false };
  }
}

/**
 * Descarga directamente el archivo de audio del beat autenticado.
 */
export async function downloadBeatFile(
  token: string,
  trackId: string,
  trackTitle: string = 'Beat_Oziris',
): Promise<void> {
  const res = await fetch(`${API_URL}/purchases/download/${trackId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(apiMessage(errorData.message, 'No fue posible descargar el archivo del beat.'));
  }

  // Manejar respuesta como Blob para forzar descarga segura en el navegador
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const cleanTitle = trackTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  a.download = `OZIRIS_${cleanTitle}.mp3`;
  
  document.body.appendChild(a);
  a.click();
  
  // Limpieza de memoria
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    if (a.parentNode) {
      document.body.removeChild(a);
    }
  }, 100);
}
