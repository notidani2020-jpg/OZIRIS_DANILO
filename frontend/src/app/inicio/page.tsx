"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Grid,
  Star,
  Tag,
  Zap,
  Play,
  Mic,
  Loader2,
} from "lucide-react";
import {
  fetchTracks,
  Track,
  fetchMyPurchasesApi,
  downloadBeatFile,
} from "@/services/api";
import UploadBeatModal from "@/components/tracks/UploadBeatModal";
import PurchasedBeatsModal from "@/components/purchases/PurchasedBeatsModal";
import FavoritesDrawer from "@/components/favorites/FavoritesDrawer";
import PaymentSimulationModal from "@/components/checkout/PaymentSimulationModal";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/context/FavoritesContext";

// Modular sub-components
import {
  AnnouncementBanner,
  InicioNavbar,
  HeroShowcase,
  CategoriesCarousel,
  GenreFilterPills,
  CatalogHeader,
  TrackCard,
  InicioDrawer,
} from "@/components/inicio";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TOP_CHARTS = [
  {
    id: "newest",
    title: "Nuevos y Destacados",
    icon: <Activity className="w-6 h-6 text-white" />,
  },
  {
    id: "rankings",
    title: "Mejores Rankings",
    icon: <Grid className="w-6 h-6 text-emerald-400" />,
  },
  {
    id: "exclusive",
    title: "Solo Exclusivos",
    icon: <Star className="w-6 h-6 text-amber-300" />,
  },
  {
    id: "under20",
    title: "Menos de $20",
    icon: <Tag className="w-6 h-6 text-teal-300" />,
  },
  {
    id: "free",
    title: "Beats Promo",
    icon: <Zap className="w-6 h-6 text-emerald-400" />,
  },
  {
    id: "all",
    title: "Todos los Beats",
    icon: <Play className="w-6 h-6 text-teal-400" />,
  },
  {
    id: "coro",
    title: "Beats con Coro",
    icon: <Mic className="w-6 h-6 text-emerald-300" />,
  },
];

const TRENDING_TAGS = [
  "Drake Type Beat",
  "Travis Scott",
  "Bad Bunny",
  "Feid",
  "Drill 140 BPM",
  "Guitar R&B",
  "Gunna",
  "Trap Dark",
];

const GENRE_FILTERS = [
  "Todo el tiempo",
  "Trap",
  "Drill",
  "Reggaeton",
  "R&B",
  "Hip Hop",
  "Boom Bap",
  "Pop",
  "Dancehall",
];

export default function InicioPage() {
  const { isInCart } = useCart();
  const { user, isAuthenticated, isAdmin, isArtist, logout } = useAuth();
  const { currentTrack, isPlaying: isPlayerPlaying, playTrack } = usePlayer();
  const {
    favorites,
    isFavorite,
    toggleFavorite: handleToggleFavorite,
    isFavoritesOpen,
    openFavorites,
    closeFavorites,
  } = useFavorites();

  // Modals & Drawers state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPurchasedBeatsModalOpen, setIsPurchasedBeatsModalOpen] = useState(false);

  // Catalog State
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>("rankings");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<string>("newest");
  const [searchFilterType, setSearchFilterType] = useState<string>("Beats");
  const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);

  // Errors, purchases, downloads
  const [audioError, setAudioError] = useState<string | null>(null);
  const [purchasedTrackIds, setPurchasedTrackIds] = useState<string[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTrackForPayment, setSelectedTrackForPayment] = useState<Track | null>(null);
  const [downloadingTrackId, setDownloadingTrackId] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("oziris_auth_token") : null;

  const loadUserPurchases = async () => {
    if (!token || !isAuthenticated || isAdmin) {
      setPurchasedTrackIds([]);
      return;
    }
    try {
      const data = await fetchMyPurchasesApi(token);
      if (Array.isArray(data)) {
        const ids = data.map((p) => p.trackId || p.track?.id || "").filter(Boolean);
        setPurchasedTrackIds(ids);
      }
    } catch (err) {
      console.warn("Error al cargar compras del usuario:", err);
    }
  };

  const loadCatalog = async () => {
    try {
      setIsLoadingTracks(true);
      const data = await fetchTracks({
        genre: selectedGenre,
        search: searchQuery,
        tag: selectedTag || undefined,
        category: selectedCategory !== "all" && selectedCategory !== "rankings" ? selectedCategory : undefined,
        sort: selectedSort,
      });
      setTracks(data);
    } catch (err) {
      console.error("Error al cargar catálogo de Beats:", err);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCatalog();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre, selectedCategory, selectedTag, selectedSort]);

  useEffect(() => {
    loadUserPurchases();
  }, [token, isAuthenticated, isAdmin]);

  const handlePlayTrack = (track: Track) => {
    playTrack(track, tracks);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedGenre(undefined);
    setSelectedCategory("rankings");
    setSelectedTag(null);
    setSelectedSort("newest");
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedGenre || (selectedCategory && selectedCategory !== "rankings") || selectedTag
  );

  const handleDownloadTrack = async (track: Track) => {
    if (!token) return;
    try {
      setDownloadingTrackId(track.id);
      await downloadBeatFile(token, track.id, track.title);
    } catch (err: any) {
      setAudioError(err.message || "Error al descargar el Beat.");
    } finally {
      setDownloadingTrackId(null);
    }
  };

  const handleBuyTrack = (track: Track) => {
    if (isAdmin) {
      setAudioError("El rol Administrador no puede simular pagos ni comprar beats. Utiliza una cuenta de usuario normal.");
      return;
    }
    if (!isAuthenticated) {
      setAudioError("Debes iniciar sesión para comprar y descargar beats.");
      return;
    }
    setSelectedTrackForPayment(track);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#090d10] text-white flex flex-col font-sans">
      {/* Toast de error de audio */}
      {audioError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 bg-red-900/90 border border-red-500/40 rounded-2xl shadow-2xl backdrop-blur-sm text-sm text-red-200 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-red-400 shrink-0">⚠️</span>
          <span>{audioError}</span>
          <button
            onClick={() => setAudioError(null)}
            className="ml-auto text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* BANNER ANNOUNCEMENT */}
      <AnnouncementBanner />

      {/* NAVBAR PRINCIPAL */}
      <InicioNavbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchFilterType={searchFilterType}
        setSearchFilterType={setSearchFilterType}
        showSearchTypeDropdown={showSearchTypeDropdown}
        setShowSearchTypeDropdown={setShowSearchTypeDropdown}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        setSelectedTag={setSelectedTag}
        setSelectedSort={setSelectedSort}
        setIsMenuOpen={setIsMenuOpen}
        setIsUploadModalOpen={setIsUploadModalOpen}
        setIsPurchasedBeatsModalOpen={setIsPurchasedBeatsModalOpen}
        purchasedTrackIds={purchasedTrackIds}
        favoritesCount={favorites.length}
        openFavorites={openFavorites}
      />

      {/* HERO SHOWCASE */}
      <HeroShowcase
        trendingTags={TRENDING_TAGS}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSelectedTag={setSelectedTag}
      />

      {/* CATÁLOGO DE BEATS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Carrusel de categorías */}
        <CategoriesCarousel
          topCharts={TOP_CHARTS}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          setSelectedGenre={setSelectedGenre}
          setSelectedTag={setSelectedTag}
        />

        {/* Filtros por género */}
        <GenreFilterPills
          genreFilters={GENRE_FILTERS}
          selectedGenre={selectedGenre}
          setSelectedGenre={setSelectedGenre}
        />

        {/* Encabezado del catálogo */}
        <CatalogHeader
          trackCount={tracks.length}
          hasActiveFilters={hasActiveFilters}
          clearAllFilters={clearAllFilters}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
          setIsUploadModalOpen={setIsUploadModalOpen}
        />

        {/* Grid de Tracks / Loading / Empty State */}
        {isLoadingTracks ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
            <p className="text-zinc-400 font-medium">Cargando catálogo de beats...</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white/[0.02] border border-white/5 p-8 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No se encontraron Beats</h3>
            <p className="text-zinc-400 text-sm mb-6">
              No hay resultados para los filtros seleccionados. Intenta restablecer la búsqueda.
            </p>
            <button
              onClick={clearAllFilters}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/25"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                isPlaying={isPlayerPlaying && currentTrack?.id === track.id}
                onPlay={handlePlayTrack}
                onSelectGenre={(genre) => setSelectedGenre(genre)}
                onSelectTag={(tag) => {
                  setSelectedTag(tag);
                  setSearchQuery("");
                }}
                isFavorite={isFavorite(track.id)}
                onToggleFavorite={handleToggleFavorite}
                isPurchased={purchasedTrackIds.includes(track.id)}
                isDownloading={downloadingTrackId === track.id}
                onDownload={handleDownloadTrack}
                onBuy={handleBuyTrack}
                isInCart={isInCart(track.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* DRAWER LATERAL MÓVIL */}
      <InicioDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        isAdmin={isAdmin}
        isArtist={isArtist}
        purchasedCount={purchasedTrackIds.length}
        favoritesCount={favorites.length}
        onOpenPurchasedModal={() => setIsPurchasedBeatsModalOpen(true)}
        onOpenFavorites={openFavorites}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onClearFilters={clearAllFilters}
        onLogout={logout}
        apiBaseUrl={API_BASE_URL}
      />

      {/* MODAL 1: SUBIR BEAT (Solo para artistas) */}
      {isArtist && (
        <UploadBeatModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            loadCatalog();
          }}
        />
      )}

      {/* MODAL 3: MIS BEATS ADQUIRIDOS */}
      <PurchasedBeatsModal
        isOpen={isPurchasedBeatsModalOpen}
        onClose={() => setIsPurchasedBeatsModalOpen(false)}
      />

      {/* DRAWER: MIS BEATS FAVORITOS */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={closeFavorites}
        favorites={favorites}
        onRemoveFavorite={(trackId) => {
          const targetTrack = tracks.find((t) => t.id === trackId) || favorites.find((f) => f.id === trackId);
          if (targetTrack) handleToggleFavorite(targetTrack);
        }}
        onPlayTrack={handlePlayTrack}
        currentlyPlayingId={currentTrack?.id || null}
        isPlaying={isPlayerPlaying}
      />

      {/* MODAL: SIMULACIÓN DE PAGO */}
      <PaymentSimulationModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedTrackForPayment(null);
        }}
        track={selectedTrackForPayment}
        onSuccess={() => {
          loadUserPurchases();
        }}
      />
    </div>
  );
}