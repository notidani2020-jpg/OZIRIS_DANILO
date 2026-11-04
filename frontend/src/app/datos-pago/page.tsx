"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck,
  Lock,
  ShoppingBag,
  CheckCircle2,
  Download,
  Loader2,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { simulatePaymentApi, downloadBeatFile, fetchTrackById, Track } from "@/services/api";

function DatosPagoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();

  const metodo = searchParams.get("metodo") || "PSE";
  const beatId = searchParams.get("beat") || "";

  const [track, setTrack] = useState<Track | null>(null);
  const [formData, setFormData] = useState({
    nombre: user?.name || "",
    documento: "",
    correo: user?.email || "",
    telefono: "",
    banco: "Bancolombia",
    tipoPersona: "Persona natural",
    celularNequi: "",
    titularTarjeta: user?.name || "",
    numeroTarjeta: "",
    vencimiento: "",
    cvv: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        nombre: prev.nombre || user.name || "",
        correo: prev.correo || user.email || "",
        titularTarjeta: prev.titularTarjeta || user.name || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    async function loadTrack() {
      if (beatId) {
        try {
          const t = await fetchTrackById(beatId);
          setTrack(t);
        } catch {}
      }
    }
    loadTrack();
  }, [beatId]);

  const actualizarCampo = (
    campo: string,
    valor: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      setErrorMsg("Debes iniciar sesión para completar la simulación de pago.");
      return;
    }

    if (!beatId) {
      setErrorMsg("No se especificó un Beat válido.");
      return;
    }

    try {
      setErrorMsg(null);
      setIsProcessing(true);

      const res = await simulatePaymentApi(token, {
        trackId: beatId,
        paymentMethod: metodo,
        licenseType: "ESTÁNDAR COMERCIAL (MP3 HQ)",
        amount: track ? Number(track.price) : 29.99,
        payerName: formData.nombre,
        payerEmail: formData.correo,
        payerPhone: formData.telefono,
        payerDocument: formData.documento,
        bankName: formData.banco,
        personType: formData.tipoPersona,
        cardHolder: formData.titularTarjeta,
        cardLastFour: formData.numeroTarjeta ? formData.numeroTarjeta.slice(-4) : undefined,
        phoneNumber: formData.celularNequi,
      });

      setTransactionData(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la simulación de pago.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!token || !beatId) return;
    try {
      setIsDownloading(true);
      await downloadBeatFile(token, beatId, track?.title || "Beat_Oziris");
    } catch (err: any) {
      showToast("error", err.message || "Error al descargar el archivo de audio.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getIcon = () => {
    if (metodo === "Tarjeta") {
      return <CreditCard className="w-6 h-6 text-emerald-400" />;
    }

    return <Building2 className="w-6 h-6 text-teal-400" />;
  };

  const getDescription = () => {
    if (metodo === "PSE") {
      return "Completa tus datos para continuar con el pago por PSE.";
    }

    return "Completa los datos de tu tarjeta para realizar el pago de forma segura.";
  };

  return (
    <main className="min-h-screen bg-[#090d10] text-white font-sans">

      {/* HEADER */}
      <header className="border-b border-emerald-500/10 bg-[#090d10]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          <Link
            href={`/checkout?beat=${beatId}`}
            className="flex items-center gap-2 text-zinc-400 hover:text-emerald-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al pago</span>
          </Link>

          <div className="flex items-center gap-2">

            <ShoppingBag className="w-5 h-5 text-emerald-400" />

            <span className="text-xl font-bold tracking-[0.25em]">
              O<span className="text-emerald-400">Z</span>IRIS
            </span>

          </div>

        </div>
      </header>

      {/* CONTENIDO */}
      <section className="max-w-4xl mx-auto px-4 py-12">

        {/* TITULO */}
        <div className="text-center mb-10">

          <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-5">

            <ShieldCheck className="w-4 h-4 text-emerald-400" />

            Información de compra

          </span>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Tus datos
          </h1>

          <p className="text-zinc-400 max-w-xl mx-auto">
            {getDescription()}
          </p>

        </div>

        {/* METODO */}
        <div className="bg-[#0f151c] border border-emerald-500/20 rounded-2xl p-5 mb-6">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              {getIcon()}
            </div>

            <div>

              <p className="text-xs text-zinc-400 uppercase tracking-wider">
                Método de pago seleccionado
              </p>

              <h2 className="text-xl font-bold text-emerald-400">
                {metodo}
              </h2>

            </div>

          </div>

        </div>

        {/* FORMULARIO */}
        <form
          onSubmit={enviarFormulario}
          className="bg-[#0f151c] border border-emerald-500/10 rounded-2xl p-6 md:p-8"
        >

          <h2 className="text-2xl font-bold mb-2">
            Información personal
          </h2>

          <p className="text-sm text-zinc-400 mb-7">
            Ingresa la información solicitada para continuar.
          </p>

          {/* DATOS PERSONALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* NOMBRE */}
            <div>

              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Nombre completo
              </label>

              <div className="relative">

                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    actualizarCampo("nombre", e.target.value)
                  }
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                />

              </div>

            </div>

            {/* DOCUMENTO */}
            <div>

              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Número de documento
              </label>

              <input
                type="text"
                required
                value={formData.documento}
                onChange={(e) =>
                  actualizarCampo("documento", e.target.value)
                }
                placeholder="Número de documento"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
              />

            </div>

            {/* CORREO */}
            <div>

              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Correo electrónico
              </label>

              <div className="relative">

                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

                <input
                  type="email"
                  required
                  value={formData.correo}
                  onChange={(e) =>
                    actualizarCampo("correo", e.target.value)
                  }
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                />

              </div>

            </div>

            {/* TELEFONO */}
            <div>

              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Número de celular
              </label>

              <div className="relative">

                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) =>
                    actualizarCampo("telefono", e.target.value)
                  }
                  placeholder="300 000 0000"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                />

              </div>

            </div>

          </div>

          {/* DATOS SEGÚN METODO */}
          <div className="border-t border-white/10 mt-8 pt-8">

            <h2 className="text-2xl font-bold mb-2">
              Datos de {metodo}
            </h2>

            <p className="text-sm text-zinc-400 mb-6">
              Información adicional para el método seleccionado.
            </p>

            {/* PSE */}
            {metodo === "PSE" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>

                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Banco
                  </label>

                  <select
                    required
                    value={formData.banco}
                    onChange={(e) =>
                      actualizarCampo("banco", e.target.value)
                    }
                    className="w-full bg-[#10171e] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                  >

                    <option value="">
                      Selecciona tu banco
                    </option>

                    <option value="Bancolombia">
                      Bancolombia
                    </option>

                    <option value="Davivienda">
                      Davivienda
                    </option>

                    <option value="Banco de Bogotá">
                      Banco de Bogotá
                    </option>

                    <option value="BBVA">
                      BBVA
                    </option>

                    <option value="Banco de Occidente">
                      Banco de Occidente
                    </option>

                    <option value="Scotiabank Colpatria">
                      Scotiabank Colpatria
                    </option>

                    <option value="Otro">
                      Otro
                    </option>

                  </select>

                </div>

                <div>

                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Tipo de persona
                  </label>

                  <select
                    value={formData.tipoPersona}
                    onChange={(e) =>
                      actualizarCampo(
                        "tipoPersona",
                        e.target.value
                      )
                    }
                    className="w-full bg-[#10171e] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                  >

                    <option value="Persona natural">
                      Persona natural
                    </option>

                    <option value="Persona jurídica">
                      Persona jurídica
                    </option>

                  </select>

                </div>

              </div>
            )}

            {/* TARJETA */}
            {metodo === "Tarjeta" && (
              <div className="space-y-5">

                <div>

                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Nombre del titular
                  </label>

                  <input
                    type="text"
                    required
                    value={formData.titularTarjeta}
                    onChange={(e) =>
                      actualizarCampo(
                        "titularTarjeta",
                        e.target.value
                      )
                    }
                    placeholder="Nombre como aparece en la tarjeta"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Número de tarjeta
                  </label>

                  <div className="relative">

                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={19}
                      value={formData.numeroTarjeta}
                      onChange={(e) =>
                        actualizarCampo(
                          "numeroTarjeta",
                          e.target.value
                        )
                      }
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                    />

                  </div>

                </div>

                <div className="grid grid-cols-2 gap-5">

                  <div>

                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Vencimiento
                    </label>

                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={formData.vencimiento}
                      onChange={(e) =>
                        actualizarCampo(
                          "vencimiento",
                          e.target.value
                        )
                      }
                      placeholder="MM/AA"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      CVV
                    </label>

                    <input
                      type="password"
                      required
                      maxLength={4}
                      inputMode="numeric"
                      value={formData.cvv}
                      onChange={(e) =>
                        actualizarCampo(
                          "cvv",
                          e.target.value
                        )
                      }
                      placeholder="•••"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                    />

                  </div>

                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500">

                  <Lock className="w-4 h-4" />

                  Estos datos no se almacenarán en esta aplicación.

                </div>

              </div>
            )}

          </div>

          {/* ERRORES */}
          {errorMsg && (
            <div className="mt-4 p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* BOTON */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={isProcessing || !!transactionData}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold shadow-lg transition transform ${
                isProcessing || !!transactionData
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-emerald-500/20 hover:scale-[1.01]"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Procesando pago simulado...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Confirmar y Simular Pago</span>
                </>
              )}
            </button>
          </div>

          {/* SEGURIDAD */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Simulación segura y protegida en entorno Sandbox</span>
          </div>

        </form>

        {/* TRANSACCIÓN EXITOSA Y DESCARGA DIRECTA */}
        {transactionData && (
          <div className="mt-8 p-6 rounded-3xl bg-[#0f151c] border border-emerald-500/40 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-white">
                    ¡Pago Simulado Exitoso!
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Transacción: <span className="font-mono text-emerald-400">{transactionData.transactionId}</span>
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">
                LICENCIA GENERADA
              </span>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.03] border border-emerald-500/20 rounded-2xl p-4">
              <div>
                <h4 className="font-bold text-white text-sm">
                  {track?.title || "Beat OZIRIS HQ"}
                </h4>
                <p className="text-xs text-zinc-400">
                  Audio Master WAV/MP3 • Licencia Comercial Activa
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition transform hover:scale-105 active:scale-95"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Descargando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar Beat Ahora</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/5 text-xs text-zinc-400">
              <Link href="/inicio" className="text-emerald-400 hover:text-emerald-300 hover:underline">
                ← Volver al catálogo de Beats
              </Link>
              <span>El beat también está guardado en tu perfil.</span>
            </div>
          </div>
        )}

      </section>

    </main>
  );
}

export default function DatosPagoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#090d10] text-white flex items-center justify-center">
          <p className="text-zinc-400">Cargando...</p>
        </main>
      }
    >
      <DatosPagoContent />
    </Suspense>
  );
}