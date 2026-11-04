"use client";

import React from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  ChevronDown,
  X,
  UploadCloud,
  Shield,
  Download,
  Heart,
  User as UserIcon,
  ShoppingBag,
  Activity,
  Zap,
  Grid,
  Mic,
  Headphones,
  Star,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface InicioNavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchFilterType: string;
  setSearchFilterType: (t: string) => void;
  showSearchTypeDropdown: boolean;
  setShowSearchTypeDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedGenre: string | undefined;
  setSelectedGenre: (genre: string | undefined) => void;
  setSelectedTag: (tag: string | null) => void;
  setSelectedSort: (sort: string) => void;
  setIsMenuOpen: (open: boolean) => void;
  setIsUploadModalOpen: (open: boolean) => void;
  setIsPurchasedBeatsModalOpen: (open: boolean) => void;
  purchasedTrackIds: string[];
  favoritesCount: number;
  openFavorites: () => void;
}

export default function InicioNavbar({
  searchQuery,
  setSearchQuery,
  searchFilterType,
  setSearchFilterType,
  showSearchTypeDropdown,
  setShowSearchTypeDropdown,
  selectedCategory,
  setSelectedCategory,
  selectedGenre,
  setSelectedGenre,
  setSelectedTag,
  setSelectedSort,
  setIsMenuOpen,
  setIsUploadModalOpen,
  setIsPurchasedBeatsModalOpen,
  purchasedTrackIds,
  favoritesCount,
  openFavorites,
}: InicioNavbarProps) {
  const { user, isAuthenticated, isAdmin, isArtist } = useAuth();
  const { cartCount, toggleCart } = useCart();

  return (
    <header className="border-b border-emerald-500/15 sticky top-0 bg-[#090d10]/95 backdrop-blur-2xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* LEFT: LOGO & NAV */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 text-zinc-400 hover:text-emerald-300 transition cursor-pointer"
            type="button"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/inicio" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text text-transparent">
              OZIRIS
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <button
              onClick={() => {
                setSelectedCategory("newest");
                setSelectedSort("newest");
              }}
              className={`transition cursor-pointer ${
                selectedCategory === "newest"
                  ? "text-emerald-400 font-bold"
                  : "hover:text-emerald-300"
              }`}
            >
              Novedades
            </button>
            <Link href="/planes" className="hover:text-emerald-300 transition">
              Precios
            </Link>
            <button
              onClick={() => {
                const el = document.getElementById("genres-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1 hover:text-emerald-300 transition cursor-pointer"
            >
              Géneros
              <ChevronDown className="w-4 h-4" />
            </button>
          </nav>
        </div>

        {/* CENTER: SEARCH BAR */}
        <div className="flex-1 max-w-xl hidden md:flex">
          <div className="w-full relative flex items-center bg-[#10171e] border border-emerald-500/20 rounded-full focus-within:border-emerald-400 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all">
            <Search className="w-4 h-4 text-emerald-400 absolute left-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca por género, BPM, artista o tag (Drake, Trap, Drill)..."
              className="w-full bg-transparent border-none py-2 pl-10 pr-28 text-sm text-white placeholder-zinc-500 focus:outline-none"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                type="button"
                className="p-1 text-zinc-400 hover:text-white mr-1 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* SEARCH FILTER DROPDOWN */}
            <div className="relative border-l border-emerald-500/20 pr-2 pl-2">
              <button
                type="button"
                onClick={() => setShowSearchTypeDropdown((prev) => !prev)}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-white py-1 px-1.5 rounded-md cursor-pointer"
              >
                <span>{searchFilterType}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {showSearchTypeDropdown && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-[#131c24] border border-emerald-500/25 rounded-xl shadow-2xl py-1 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                  {["Beats", "Trap", "Drill", "Reggaeton", "R&B", "Hip Hop"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSearchFilterType(t);
                        setShowSearchTypeDropdown(false);
                        if (t !== "Beats") setSelectedGenre(t);
                        else setSelectedGenre(undefined);
                      }}
                      className={`w-full text-left px-3 py-1.5 transition cursor-pointer ${
                        searchFilterType === t
                          ? "text-emerald-300 font-bold bg-emerald-500/15"
                          : "text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: BUTTONS & AUTH */}
        <div className="flex items-center gap-3 text-sm font-medium">
          {/* SUBIR BEAT (Solo para perfiles de Artista / Productor) */}
          {isArtist && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              type="button"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-4 py-2 rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 border border-emerald-300/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Subir Beat</span>
            </button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3 text-zinc-300">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}

              {/* MIS BEATS ADQUIRIDOS (DESCARGAS) */}
              <button
                onClick={() => setIsPurchasedBeatsModalOpen(true)}
                type="button"
                className="relative flex items-center justify-center p-2.5 bg-[#10171e] hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 rounded-full transition cursor-pointer group"
                title="Mis Beats Adquiridos y Descargas"
              >
                <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {purchasedTrackIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-in zoom-in duration-200">
                    {purchasedTrackIds.length}
                  </span>
                )}
              </button>

              {/* FAVORITOS */}
              <button
                onClick={openFavorites}
                type="button"
                className="relative flex items-center justify-center p-2.5 bg-[#10171e] hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 rounded-full transition cursor-pointer group"
                title="Mis Beats Favoritos"
              >
                <Heart className="w-4 h-4 fill-rose-500 group-hover:scale-110 transition-transform" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/50 animate-in zoom-in duration-200">
                    {favoritesCount}
                  </span>
                )}
              </button>

              {/* PERFIL */}
              <Link
                href="/perfil"
                className="flex items-center gap-2 bg-[#10171e] hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 px-3 py-1.5 rounded-full transition cursor-pointer group"
                title="Editar mi perfil"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center overflow-hidden border border-emerald-500/30">
                  {user?.avatarUrl ? (
                    <img
                      src={
                        user.avatarUrl.startsWith("http")
                          ? user.avatarUrl
                          : `${API_BASE_URL}${user.avatarUrl}`
                      }
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || (
                      <UserIcon className="w-3.5 h-3.5" />
                    )
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-zinc-200 group-hover:text-emerald-300">
                  {user?.name?.split(" ")[0]}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="text-xs font-semibold text-zinc-300 hover:text-white transition"
              >
                Registro
              </Link>
              <Link
                href="/login"
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}

          {/* CARRITO */}
          <button
            onClick={toggleCart}
            type="button"
            className="relative flex items-center justify-center p-2.5 bg-[#10171e] hover:bg-emerald-500/20 text-zinc-300 hover:text-white border border-white/10 hover:border-emerald-500/30 rounded-full transition cursor-pointer group"
            title="Carrito de compras"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/40 animate-in zoom-in duration-200">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE SEARCH BAR */}
      <div className="md:hidden px-4 pb-3 pt-1">
        <div className="relative flex items-center bg-[#10171e] border border-emerald-500/20 rounded-full">
          <Search className="w-4 h-4 text-emerald-400 absolute left-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar beats, género, productor..."
            className="w-full bg-transparent border-none py-2 pl-9 pr-9 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              type="button"
              className="p-1 text-zinc-400 hover:text-white absolute right-2.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SECONDARY NAVIGATION BAR (GÉNEROS) */}
      <div
        id="genres-section"
        className="border-t border-emerald-500/10 bg-[#0c1217]/95 hidden md:block"
      >
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center justify-center gap-8 text-xs font-semibold text-zinc-400">
          <button
            onClick={() => {
              setSelectedGenre(undefined);
              setSelectedTag(null);
            }}
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              !selectedGenre
                ? "text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5"
                : "hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Todos los Beats
          </button>
          <button
            onClick={() => setSelectedGenre("Trap")}
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              selectedGenre === "Trap"
                ? "text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5"
                : "hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Trap
          </button>
          <button
            onClick={() => setSelectedGenre("Drill")}
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              selectedGenre === "Drill"
                ? "text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5"
                : "hover:text-white"
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-teal-400" />
            Drill
          </button>
          <button
            onClick={() => setSelectedGenre("Reggaeton")}
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              selectedGenre === "Reggaeton"
                ? "text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5"
                : "hover:text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-300" />
            Reggaeton & Urbano
          </button>
          <button
            onClick={() => setSelectedGenre("R&B")}
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              selectedGenre === "R&B"
                ? "text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5"
                : "hover:text-white"
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-teal-300" />
            R&B Soul
          </button>
          <button
            onClick={() => setSelectedGenre("Hip Hop")}
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              selectedGenre === "Hip Hop"
                ? "text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5"
                : "hover:text-white"
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-300" />
            Hip Hop Clásico
          </button>
        </div>
      </div>
    </header>
  );
}
