"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  Loader2,
  Music2,
  AlertTriangle,
  BadgeCheck,
  Receipt,
  FileCheck,
  Disc3,
} from "lucide-react";
import { Track, PaymentSimulationResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { simulatePaymentApi, downloadBeatFile } from "@/services/api";

interface PaymentSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  track?: Track | null;
  tracks?: Track[];
  onSuccess?: (result: PaymentSimulationResponse) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getImageUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}

export default function PaymentSimulationModal({
  isOpen,
  onClose,
  track,
  tracks,
  onSuccess,
}: PaymentSimulationModalProps) {
  const { user, token, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();

  const itemsToBuy: Track[] = tracks && tracks.length > 0 ? tracks : track ? [track] : [];
  const totalAmount = itemsToBuy.reduce((acc, curr) => acc + (Number(curr.price) || 29.99), 0);

  const [paymentMethod, setPaymentMethod] = useState<string>("PSE");
  const [licenseType, setLicenseType] = useState<string>("Estándar Comercial (MP3 320kbps + WAV 24-bit)");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<PaymentSimulationResponse | null>(null);
  const [isDownloading, setIsDownloading] = useState<{ [trackId: string]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSimulationResult(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen || itemsToBuy.length === 0) return null;

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      setError("Debes iniciar sesión para realizar compras o descargas.");
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      setProcessingStep("Validando orden de compra y generando contrato de licencia...");

      const trackIds = itemsToBuy.map((t) => t.id);
      const res = await simulatePaymentApi(token, {
        trackIds,
        paymentMethod,
        licenseType,
        amount: totalAmount,
        payerName: user?.name || "Cliente Oziris",
        payerEmail: user?.email || undefined,
      });

      await new Promise((r) => setTimeout(r, 650));
      setSimulationResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al procesar la simulación de pago.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const handleDirectDownload = async (item: Track) => {
    if (!token) return;
    try {
      setIsDownloading((prev) => ({ ...prev, [item.id]: true }));
      await downloadBeatFile(token, item.id, item.title);
    } catch (err: any) {
      showToast("error", err.message || "Error al descargar el archivo de audio.");
    } finally {
      setIsDownloading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-hide text-zinc-100">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {simulationResult ? "Confirmación de Compra" : "Checkout & Licencia Comercial"}
              </h3>
              <p className="text-xs text-zinc-400">
                OZIRIS Audio Licensing • Simulación de Transacción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ALERTA DE ERROR */}
        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-950/60 border border-red-800/50 text-red-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* VISTA 1: CHECKOUT FORM */}
        {!simulationResult && (
          <form onSubmit={handleSimulatePayment} className="space-y-4">
            
            {/* ITEM SUMMARY */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                  {getImageUrl(itemsToBuy[0]?.coverUrl) ? (
                    <img
                      src={getImageUrl(itemsToBuy[0]?.coverUrl)!}
                      alt={itemsToBuy[0]?.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      <Music2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-white text-xs sm:text-sm truncate">
                    {itemsToBuy.length === 1 ? itemsToBuy[0].title : `${itemsToBuy.length} Beats en el pedido`}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {itemsToBuy[0]?.genre || "Instrumental"} • Audio Master HQ
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-zinc-400 block">Total:</span>
                <span className="text-base font-bold text-zinc-100">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Método de Pago Simulado
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("PSE")}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === "PSE"
                      ? "bg-zinc-800 border-zinc-500 text-white font-semibold"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>PSE Banco</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("Tarjeta")}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === "Tarjeta"
                      ? "bg-zinc-800 border-zinc-500 text-white font-semibold"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Tarjeta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("Nequi / Móvil")}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition ${
                    paymentMethod === "Nequi / Móvil"
                      ? "bg-zinc-800 border-zinc-500 text-white font-semibold"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Nequi / App</span>
                </button>
              </div>
            </div>

            {/* ORDER DETAILS */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Comprador:</span>
                <span className="font-medium text-zinc-200">{user?.name} ({user?.email})</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tipo de Licencia:</span>
                <span className="font-medium text-zinc-200">Comercial Ilimitada</span>
              </div>
              <div className="flex justify-between text-zinc-400 border-t border-zinc-800 pt-2">
                <span>Entorno:</span>
                <span className="font-mono text-emerald-400">Sandbox Aprobado</span>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing || isAdmin || !isAuthenticated}
                className={`w-full py-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition ${
                  isProcessing || isAdmin || !isAuthenticated
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-zinc-100 hover:bg-white text-zinc-950 shadow-md active:scale-98"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                    <span>{processingStep || "Procesando transacción..."}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-zinc-900" />
                    <span>Confirmar Pago Simulado ({formatPrice(totalAmount)})</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Transacción cifrada y entrega inmediata de archivos master</span>
            </p>

          </form>
        )}

        {/* VISTA 2: SUCCESS & DOWNLOAD DELIVERY */}
        {simulationResult && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-white">
                Transacción Aprobada
              </h4>
              <p className="text-xs text-zinc-400">
                Referencia: <span className="font-mono text-emerald-400">{simulationResult.transactionId}</span>
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Descarga de Archivos
              </span>

              {itemsToBuy.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                      <Music2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-semibold text-xs text-white truncate">
                        {item.title}
                      </h5>
                      <p className="text-[10px] text-zinc-500">Audio HQ .mp3 / WAV</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDirectDownload(item)}
                    disabled={isDownloading[item.id]}
                    type="button"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                  >
                    {isDownloading[item.id] ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Descargando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                type="button"
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
