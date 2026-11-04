"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Download,
  Heart,
  UploadCloud,
  Grid,
  Star,
  CreditCard,
  User as UserIcon,
  Shield,
  LogOut,
} from "lucide-react";

interface InicioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user: {
    name?: string;
    email?: string;
    role?: string;
    avatarUrl?: string | null;
  } | null;
  isAdmin: boolean;
  isArtist: boolean;
  purchasedCount: number;
  favoritesCount: number;
  onOpenPurchasedModal: () => void;
  onOpenFavorites: () => void;
  onOpenUploadModal: () => void;
  onClearFilters: () => void;
  onLogout: () => void;
  apiBaseUrl?: string;
}

export const InicioDrawer: React.FC<InicioDrawerProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
  user,
  isAdmin,
  isArtist,
  purchasedCount,
  favoritesCount,
  onOpenPurchasedModal,
  onOpenFavorites,
  onOpenUploadModal,
  onClearFilters,
  onLogout,
  apiBaseUrl = "http://localhost:4000",
}) => {
  if (!isOpen) return null;

  const avatarSrc = user?.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${apiBaseUrl}${user.avatarUrl}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-80 bg-[#090d10] border-r border-emerald-500/15 h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-left duration-300 z-10">
        {/* DRAWER HEADER / USER SUMMARY */}
        <div className="p-6 border-b border-emerald-500/15 bg-gradient-to-b from-[#0f171e] to-[#090d10]">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xl font-extrabold tracking-widest bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text text-transparent">
              OZIRIS
            </span>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TARJETA DE USUARIO */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-emerald-500/15 shadow-inner">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/40 bg-emerald-950/60 shrink-0 shadow-md">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user?.name || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-lg text-emerald-300">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-white truncate">
                  {user?.name}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  {user?.email}
                </p>
                <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  {user?.role || "USER"}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
              <p className="text-xs text-zinc-300 font-medium mb-3">
                Inicia sesión para descargar y guardar tus Beats
              </p>
              <Link
                href="/login"
                onClick={onClose}
                className="block w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>

        {/* DRAWER MENU ITEMS SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide text-sm">
          {/* SECCIÓN: MI BIBLIOTECA */}
          {isAuthenticated && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-3">
                Mi Biblioteca
              </span>

              <button
                onClick={() => {
                  onClose();
                  onOpenPurchasedModal();
                }}
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 text-emerald-300 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-white group-hover:text-emerald-300">
                    Mis Beats Adquiridos
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {purchasedCount}
                </span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenFavorites();
                }}
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 text-rose-300 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition">
                    <Heart className="w-4 h-4 fill-rose-500/30" />
                  </div>
                  <span className="font-semibold text-sm text-white group-hover:text-rose-300">
                    Mis Beats Favoritos
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                  {favoritesCount}
                </span>
              </button>

              {isArtist && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUploadModal();
                  }}
                  type="button"
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition text-emerald-300 group text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white group-hover:text-emerald-300">
                    Subir Nuevo Beat
                  </span>
                </button>
              )}
            </div>
          )}

          {/* SECCIÓN: EXPLORAR CATÁLOGO */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-3">
              Explorar Catálogo
            </span>

            <button
              onClick={() => {
                onClose();
                onClearFilters();
              }}
              type="button"
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/5 transition text-zinc-300 hover:text-white text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
                <Grid className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Todos los Beats</span>
            </button>

            <Link
              href="/planes"
              onClick={onClose}
              className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/5 transition text-zinc-300 hover:text-white"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Star className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Planes y Precios</span>
            </Link>

            <Link
              href="/formas-pago"
              onClick={onClose}
              className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/5 transition text-zinc-300 hover:text-white"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-300 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Formas de Pago</span>
            </Link>
          </div>

          {/* SECCIÓN: CUENTA Y AJUSTES */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-3">
              Cuenta y Ajustes
            </span>

            {isAuthenticated && (
              <Link
                href="/perfil"
                onClick={onClose}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/5 transition text-zinc-300 hover:text-white text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">Editar Mi Perfil</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 hover:bg-emerald-900/30 transition text-emerald-200"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">Panel Administrador</span>
              </Link>
            )}
          </div>
        </div>

        {/* DRAWER FOOTER */}
        {isAuthenticated && (
          <div className="p-5 border-t border-white/10 bg-[#090d10]">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              type="button"
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
