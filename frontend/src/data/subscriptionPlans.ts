export interface SubscriptionPlan {
  id: 'basico' | 'pro' | 'ilimitado';
  name: string;
  description: string;
  annualPrice: number;
  monthlyPrice: number;
  features: string[];
  highlighted: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basico',
    name: 'Free',
    description: 'Disfruta limitadamente',
    annualPrice: 0,
    monthlyPrice: 0,
    features: [
      'Subir hasta 10 beats',
      'Licencia estándar',
      '0% de comisión por beat',
      'Uso no exclusivo',
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Plus',
    description: 'Beneficios exclusivos',
    annualPrice: 250000,
    monthlyPrice: 25000,
    features: [
      'Subir hasta 100 beats',
      'Perfil mejorado (banners, links, redes)',
      '15% de comisión en ventas',
      'Acceso limitado a licencias exclusivas',
    ],
    highlighted: true,
  },
  {
    id: 'ilimitado',
    name: 'Premium',
    description: 'Disfruta a tu estilo',
    annualPrice: 600000,
    monthlyPrice: 50000,
    features: [
      'Beats ilimitados',
      'Perfil avanzado',
      '50% de comisión en ventas',
      'Licencias exclusivas y personalizadas',
    ],
    highlighted: false,
  },
];

export function formatPlanPrice(value: number): string {
  if (value === 0) return '$0.00';
  return `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value)}`;
}