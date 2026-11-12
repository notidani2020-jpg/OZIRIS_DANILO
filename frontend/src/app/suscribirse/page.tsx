"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  formatPlanPrice,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/data/subscriptionPlans";

type PaymentMethod = "Tarjeta" | "PSE" | "Nequi / Daviplata";

interface BillingData {
  fullName: string;
  email: string;
  document: string;
  phone: string;
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  bank: string;
  personType: string;
  walletPhone: string;
}

const EMPTY_BILLING: BillingData = {
  fullName: "",
  email: "",
  document: "",
  phone: "",
  cardHolder: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
  bank: "Bancolombia",
  personType: "Persona natural",
  walletPhone: "",
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15";
const selectClass =
  "w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-3 text-sm text-white [color-scheme:dark] outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15";

function BillingField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-medium text-zinc-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const planId = searchParams.get("plan");
  const plan = SUBSCRIPTION_PLANS.find((item) => item.id === planId);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PSE");
  const [billing, setBilling] = useState<BillingData>(EMPTY_BILLING);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!user) return;
    setBilling((current) => ({
      ...current,
      fullName: current.fullName || [user.name, user.lastName].filter(Boolean).join(" "),
      email: current.email || user.email,
      cardHolder: current.cardHolder || [user.name, user.lastName].filter(Boolean).join(" "),
    }));
  }, [user]);

  const updateBilling = (field: keyof BillingData, value: string) => {
    setBilling((current) => ({ ...current, [field]: value }));
  };

  const choosePlan = (nextPlan: string) => {
    router.replace(`/suscribirse?plan=${nextPlan}`, { scroll: false });
    setIsComplete(false);
  };

  const submitSubscription = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plan || isSubmitting) return;

    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setBilling((current) => ({ ...current, cardNumber: "", cvv: "" }));
    setIsSubmitting(false);
    setIsComplete(true);
  };

  if (!plan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090d10] px-4 text-white">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Selecciona un plan</h1>
          <p className="mt-2 text-sm text-zinc-400">
            No encontramos ese plan. Elige uno para continuar con la suscripción.
          </p>
          <Link
            href="/planes"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-bold text-[#07110d] transition hover:bg-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" /> Ver planes
          </Link>
        </div>
      </main>
    );
  }

  const isFree = plan.annualPrice === 0;
  const trialLabel = isFree ? "Plan gratuito" : "Prueba gratis de 7 días";

  return (
    <main className="min-h-screen bg-[#090d10] text-white">
      <header className="border-b border-white/[0.07] bg-[#090d10]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/planes"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a planes
          </Link>
          <div className="text-lg font-bold tracking-[0.22em]">
            O<span className="text-emerald-400">Z</span>IRIS
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <LockKeyhole className="h-3.5 w-3.5 text-emerald-400" /> Checkout
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
            Suscripción anual
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Completa tus datos
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Revisa tu plan y confirma la solicitud de suscripción.
          </p>
        </div>

        {isComplete ? (
          <section className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/20 bg-[#0c1415] p-6 sm:p-9">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Confirmación de demostración
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {isFree ? "Plan gratuito listo" : "¡Tienes 7 días gratis!"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {isFree
                ? `La selección del plan ${plan.name} está lista en esta demostración. No se procesó ningún cargo ni se activó una suscripción real.`
                : `El plan ${plan.name} contempla 7 días gratis y luego una facturación anual de ${formatPlanPrice(plan.annualPrice)}. Esta es una demostración: no se procesó ningún cargo ni se activó una suscripción real.`}
            </p>
            <div className="my-6 border-t border-white/10 pt-5">
              <h3 className="text-sm font-semibold text-white">Beneficios de {plan.name}</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/inicio"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3.5 text-sm font-bold text-[#07110d] transition hover:bg-emerald-300"
            >
              <BadgeCheck className="h-4 w-4" /> Continuar a OZIRIS
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)] lg:gap-8">
            <form id="subscription-form" onSubmit={submitSubscription} className="space-y-5">
              <section className="rounded-2xl border border-white/[0.08] bg-[#0c1217] p-5 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/15 bg-emerald-500/[0.08]">
                    <UserRound className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Datos de facturación</h2>
                    <p className="mt-0.5 text-xs text-zinc-500">Información de contacto y recibo</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <BillingField id="fullName" label="Nombre completo">
                    <input id="fullName" name="name" autoComplete="name" required maxLength={120} value={billing.fullName} onChange={(event) => updateBilling("fullName", event.target.value)} placeholder="Tu nombre y apellido" className={inputClass} />
                  </BillingField>
                  <BillingField id="email" label="Correo electrónico">
                    <input id="email" name="email" type="email" autoComplete="email" required maxLength={160} value={billing.email} onChange={(event) => updateBilling("email", event.target.value)} placeholder="tu@correo.com" className={inputClass} />
                  </BillingField>
                  <BillingField id="document" label="Documento / NIT">
                    <input id="document" name="document" autoComplete="off" required minLength={5} maxLength={24} value={billing.document} onChange={(event) => updateBilling("document", event.target.value)} placeholder="Número de identificación" className={inputClass} />
                  </BillingField>
                  <BillingField id="phone" label="Teléfono">
                    <input id="phone" name="tel" type="tel" autoComplete="tel" required minLength={7} maxLength={24} value={billing.phone} onChange={(event) => updateBilling("phone", event.target.value)} placeholder="+57 300 000 0000" className={inputClass} />
                  </BillingField>
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-[#0c1217] p-5 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/15 bg-emerald-500/[0.08]">
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Método de pago</h2>
                    <p className="mt-0.5 text-xs text-zinc-500">Selecciona cómo continuar</p>
                  </div>
                </div>

                {isFree ? (
                  <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] p-4 text-sm text-emerald-200">
                    Este plan no requiere método de pago ni genera cobros.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Método de pago">
                      {([
                        { id: "Tarjeta", label: "Tarjeta", icon: CreditCard },
                        { id: "PSE", label: "PSE", icon: Building2 },
                        { id: "Nequi / Daviplata", label: "Nequi / Daviplata", icon: Smartphone },
                      ] as const).map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={paymentMethod === id}
                          onClick={() => setPaymentMethod(id)}
                          className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3 text-center text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${paymentMethod === id ? "border-emerald-400/50 bg-emerald-400/[0.08] text-emerald-200" : "border-white/[0.08] bg-neutral-900 text-neutral-400 hover:border-white/20 hover:bg-neutral-800 hover:text-white"}`}
                        >
                          <Icon className={`h-4 w-4 ${paymentMethod === id ? "text-emerald-400" : ""}`} />
                          {label}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === "Tarjeta" && (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <BillingField id="cardHolder" label="Nombre en la tarjeta">
                            <input id="cardHolder" autoComplete="cc-name" required maxLength={100} value={billing.cardHolder} onChange={(event) => updateBilling("cardHolder", event.target.value)} placeholder="Como aparece en la tarjeta" className={inputClass} />
                          </BillingField>
                        </div>
                        <div className="sm:col-span-2">
                          <BillingField id="cardNumber" label="Número de tarjeta">
                            <input id="cardNumber" inputMode="numeric" autoComplete="cc-number" required minLength={12} maxLength={23} pattern="[0-9 ]{12,23}" value={billing.cardNumber} onChange={(event) => updateBilling("cardNumber", event.target.value.replace(/[^0-9 ]/g, ""))} placeholder="0000 0000 0000 0000" className={inputClass} />
                          </BillingField>
                        </div>
                        <BillingField id="expiry" label="Vencimiento (MM/AA)">
                          <input id="expiry" autoComplete="cc-exp" required pattern="(0[1-9]|1[0-2])/[0-9]{2}" value={billing.expiry} onChange={(event) => updateBilling("expiry", event.target.value)} placeholder="MM/AA" className={inputClass} />
                        </BillingField>
                        <BillingField id="cvv" label="CVV">
                          <input id="cvv" type="password" inputMode="numeric" autoComplete="cc-csc" required minLength={3} maxLength={4} pattern="[0-9]{3,4}" value={billing.cvv} onChange={(event) => updateBilling("cvv", event.target.value.replace(/\D/g, ""))} placeholder="•••" className={inputClass} />
                          </BillingField>
                      </div>
                    )}

                    {paymentMethod === "PSE" && (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <BillingField id="bank" label="Banco">
                          <select id="bank" value={billing.bank} onChange={(event) => updateBilling("bank", event.target.value)} className={selectClass}>
                            <option className="bg-neutral-900 text-white">Bancolombia</option>
                            <option className="bg-neutral-900 text-white">Davivienda</option>
                            <option className="bg-neutral-900 text-white">BBVA</option>
                            <option className="bg-neutral-900 text-white">Banco de Bogotá</option>
                            <option className="bg-neutral-900 text-white">Otro banco</option>
                          </select>
                        </BillingField>
                        <BillingField id="personType" label="Tipo de persona">
                          <select id="personType" value={billing.personType} onChange={(event) => updateBilling("personType", event.target.value)} className={selectClass}>
                            <option className="bg-neutral-900 text-white">Persona natural</option>
                            <option className="bg-neutral-900 text-white">Persona jurídica</option>
                          </select>
                        </BillingField>
                      </div>
                    )}

                    {paymentMethod === "Nequi / Daviplata" && (
                      <div className="mt-5">
                        <BillingField id="walletPhone" label="Número de celular de la billetera">
                          <input id="walletPhone" type="tel" inputMode="tel" required minLength={10} maxLength={16} value={billing.walletPhone} onChange={(event) => updateBilling("walletPhone", event.target.value)} placeholder="300 000 0000" className={inputClass} />
                        </BillingField>
                      </div>
                    )}
                  </>
                )}

                <p className="mt-5 flex items-start gap-2 border-t border-white/[0.07] pt-4 text-xs leading-5 text-zinc-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  Demostración de checkout: no uses datos reales. No se envían datos de tarjeta ni se procesa ningún cargo.
                </p>
              </section>

              <button
                type="submit"
                disabled={isSubmitting || isAuthLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-4 text-sm font-bold text-[#07110d] shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 hover:shadow-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d10] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Preparando confirmación…</>
                ) : (
                  <><LockKeyhole className="h-4 w-4" /> {isFree ? "Activar plan gratuito" : "Confirmar suscripción"}</>
                )}
              </button>
            </form>

            <aside className="rounded-2xl border border-white/[0.08] bg-[#0c1217] p-5 sm:p-6 lg:sticky lg:top-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Tu plan</p>
                  <h2 className="mt-1 text-2xl font-bold">{plan.name}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{plan.description}</p>
                </div>
                {plan.highlighted && (
                  <span className="shrink-0 rounded-md border border-emerald-500/20 bg-emerald-500/[0.08] px-2 py-1 text-[10px] font-semibold tracking-wide text-emerald-300">
                    POPULAR
                  </span>
                )}
              </div>

              <div className="mt-5 rounded-lg border border-white/[0.07] bg-black/20 p-4">
                <label htmlFor="plan-choice" className="mb-2 block text-xs text-zinc-400">Cambiar plan</label>
                <select id="plan-choice" value={plan.id} onChange={(event) => choosePlan(event.target.value)} className={selectClass}>
                  {SUBSCRIPTION_PLANS.map((option) => (
                    <option key={option.id} value={option.id} className="bg-neutral-900 text-white">{option.name} · {formatPlanPrice(option.annualPrice)} / año</option>
                  ))}
                </select>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-zinc-400">Precio anual</span>
                  <span className="text-xl font-bold">{formatPlanPrice(plan.annualPrice)}<span className="ml-1 text-xs font-normal text-zinc-500">/ año</span></span>
                </div>
                <p className="mt-1 text-right text-xs text-emerald-400">Mes por tan solo {formatPlanPrice(plan.monthlyPrice)}</p>
              </div>

              <div className="my-5 border-t border-white/[0.08]" />

              <div className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] p-3.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-100">{trialLabel}</p>
                  {!isFree && <p className="mt-0.5 text-xs text-zinc-400">Luego, facturación anual.</p>}
                </div>
              </div>

              <h3 className="text-sm font-semibold">Beneficios incluidos</h3>
              <ul className="mt-3 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm leading-5 text-zinc-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-3 border-t border-white/[0.08] pt-5 text-sm">
                <div className="flex justify-between gap-3 text-zinc-400">
                  <span>Subtotal anual</span><span className="text-zinc-200">{formatPlanPrice(plan.annualPrice)}</span>
                </div>
                <div className="flex justify-between gap-3 text-zinc-400">
                  <span>Impuestos</span><span className="text-zinc-200">No aplican</span>
                </div>
                <div className="flex items-end justify-between gap-3 border-t border-white/[0.08] pt-4">
                  <span className="font-semibold">Total a pagar hoy</span>
                  <span className="text-xl font-bold text-emerald-300">{formatPlanPrice(0)}</span>
                </div>
                {!isFree && <p className="text-right text-xs leading-5 text-zinc-500">Después de los 7 días gratis: {formatPlanPrice(plan.annualPrice)} al año. Simulación sin cobro real.</p>}
              </div>

              <button
                type="submit"
                form="subscription-form"
                disabled={isSubmitting || isAuthLoading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-4 text-sm font-bold text-[#07110d] shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 hover:shadow-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d10] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Preparando confirmación…</>
                ) : (
                  <><LockKeyhole className="h-4 w-4" /> {isFree ? "Activar plan gratuito" : "Confirmar suscripción"}</>
                )}
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function SubscriptionLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090d10] text-zinc-400">
      <Loader2 className="mr-3 h-5 w-5 animate-spin text-emerald-400" /> Cargando checkout…
    </main>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<SubscriptionLoading />}>
      <SubscriptionContent />
    </Suspense>
  );
}