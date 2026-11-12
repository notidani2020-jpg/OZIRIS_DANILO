// Indicamos que es un "Client Component" para poder tener estado y eventos en Next.js App Router
"use client";

import React from 'react';
import { Check, Star, X } from 'lucide-react'; // Iconos de palomita y estrella
import { useRouter } from 'next/navigation';
import { formatPlanPrice, SUBSCRIPTION_PLANS } from '@/data/subscriptionPlans';

export default function PricingPage() {
  const router = useRouter();

  return (
    // Contenedor principal: min-h-screen para cubrir toda la pantalla, con fondo oscuro
    <div className="min-h-screen bg-[#090d10] text-white py-20 px-4 flex flex-col items-center relative overflow-hidden">
      <button 
        onClick={() => router.push('/inicio')}
        className="absolute top-8 left-8 md:top-12 md:left-12 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors z-20 cursor-pointer"
      >
        <X className="w-6 h-6 text-zinc-400" />
      </button>

      {/* Background Glow Decorators */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Elige tu plan</h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Únete a nuestra comunidad y potencia tu carrera musical con las mejores herramientas del mercado.
          </p>
        </div>

        {/* Grid para acomodar las tarjetas: 1 columna en móvil, 3 columnas en pantallas medianas/grandes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {/* Iteramos sobre nuestra constante `plans` para renderizar cada tarjeta dinámicamente */}
          {SUBSCRIPTION_PLANS.map((plan, index) => (
            <div 
              key={plan.name}
              className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-8 ${
                plan.highlighted 
                  ? 'bg-gradient-to-b from-emerald-950/30 to-teal-950/20 border border-emerald-500/40 shadow-2xl shadow-emerald-500/15' 
                  : 'bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 backdrop-blur-sm'
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-extrabold px-4 py-1 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
                  <Star className="w-3.5 h-3.5 fill-slate-950" /> MÁS POPULAR
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-3xl font-bold mb-2 tracking-tight">{plan.name}</h3>
                <p className="text-zinc-400 text-sm h-5">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl md:text-5xl font-bold tracking-tighter">{formatPlanPrice(plan.annualPrice)}</span>
                  <span className="text-zinc-400 font-medium">/ año</span>
                </div>
                <div className="text-sm font-medium text-emerald-400">
                  Mes por tan solo {formatPlanPrice(plan.monthlyPrice)}
                </div>
              </div>

              <div className="h-[1px] w-full bg-white/10 mb-8" />

              <div className="flex-grow">
                {/* Lista de beneficios iterada dinámicamente para cada plan */}
                <h4 className="text-lg font-semibold mb-6">Beneficios</h4>
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                      <div className="mt-0.5 bg-emerald-500/20 p-1 rounded-full shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 pt-4">
                <button
                  onClick={() => router.push(`/suscribirse?plan=${plan.id}`)}
                  className={`w-full py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/5'
                  }`}
                >
                  Suscríbete ahora
                </button>
                <p className="text-center text-xs font-medium text-zinc-500 mt-4 uppercase tracking-wider">
                  Comienza la prueba de 7 dias
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
