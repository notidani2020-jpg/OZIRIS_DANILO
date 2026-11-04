"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Music,
  Play,
  Pause,
  Heart,
  Download,
  ShoppingBag,
  Pencil,
  Loader2,
  Headphones,
  Disc3,
  CalendarDays,
  Link2,
  AtSign,
  PlayCircle,
  AlertCircle,
} from "lucide-react";
import {
  fetchPublicArtistApi,
  fetchTracks,
  fetchMyPurchasesApi,
  downloadBeatFile,
  Track,
} from "@/services/api";
import type { PublicArtist } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useToast } from "@/context/ToastContext";
import PaymentSimulationModal from "@/components/checkout/PaymentSimulationModal";
import EditBeatModal from "@/components/tracks/EditBeatModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function fullUrl(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
}

function safeExternal(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function formatCount(n: number): string {
  return new Intl.NumberFormat("es-CO", { notation: "compact" }).format(n);
}

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, token, isAuthenticated, isAdmin } = useAuth();
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  const [artist, setArtist] = useState<PublicArtist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [trackToPay, setTrackToPay] = useState<Track | null>(null);
  const [trackToEdit, setTrackToEdit] = useState<Track | null>(null);

  const isOwner = !!user && user.id === id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, t] = await Promise.all([
          fetchPublicArtistApi(id),
          fetchTracks({ producerId: id, sort: "newest" }),
        ]);
        if (cancelled) return;
        setArtist(a);
        setTracks(t);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el perfil.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loadPurchases = useCallback(async () => {
    if (!token) return;
    const purchases = await fetchMyPurchasesApi(token);
    setPurchasedIds(
      new Set(purchases.filter((p) => p.status === "COMPLETED").map((p) => p.trackId || p.track?.id || "")),
    );
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMyPurchasesApi(token).then((purchases) => {
      if (cancelled) return;
      setPurchasedIds(
        new Set(purchases.filter((p) => p.status === "COMPLETED").map((p) => p.trackId || p.track?.id || "")),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleBuy = (track: Track) => {
    if (isAdmin) return showToast("info", "Las cuentas de administrador no pueden comprar beats.");
    if (!isAuthenticated) return showToast("info", "Inicia sesión para comprar y descargar beats.");
    setTrackToPay(track);
  };

  const handleDownload = async (track: Track) => {
    if (!token) return;
    try {
      setDownloadingId(track.id);
      await downloadBeatFile(token, track.id, track.title);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Error al descargar el Beat.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d10] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-[#090d10] text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <h1 className="text-xl font-bold">{error || "Artista no encontrado"}</h1>
        <Link href="/inicio" className="text-emerald-400 hover:text-emerald-300 text-sm underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const bannerSrc = fullUrl(artist.bannerUrl);
  const avatarSrc = fullUrl(artist.avatarUrl);
  const socials = [
    { label: "Spotify", href: safeExternal(artist.spotifyUrl), icon: <Link2 className="w-4 h-4" /> },
    { label: "Instagram", href: safeExternal(artist.instagramUrl), icon: <AtSign className="w-4 h-4" /> },
    { label: "YouTube", href: safeExternal(artist.youtubeUrl), icon: <PlayCircle className="w-4 h-4" /> },
  ].filter((s) => s.href);

  return (
    <div className="min-h-screen bg-[#090d10] text-white pb-32">
      <header className="sticky top-0 z-30 bg-[#090d10]/90 backdrop-blur-md border-b border-emerald-500/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/inicio" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          {isOwner && (
            <Link
              href="/perfil"
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar perfil
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* CABECERA */}
        <section className="bg-[#0c1217] border border-emerald-500/10 rounded-3xl overflow-hidden">
          <div className="relative h-36 sm:h-56 bg-gradient-to-br from-[#122421] to-[#0c181f]">
            {bannerSrc && <img src={bannerSrc} alt="" className="w-full h-full object-cover" />}
          </div>

          <div className="px-5 sm:px-7 pb-6 -mt-12 sm:-mt-14 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#0c1217] bg-zinc-900 shadow-xl shrink-0">
              {avatarSrc ? (
                <img src={avatarSrc} alt={artist.artistName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#122421] to-[#0c181f] text-emerald-300 font-extrabold text-3xl">
                  {artist.artistName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold truncate">{artist.artistName}</h1>
                {artist.verified && (
                  <span
                    title="Artista verificado"
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5"
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Verificado
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                {artist.genre && (
                  <span className="text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2.5 py-0.5 font-semibold">
                    {artist.genre}
                  </span>
                )}
                {artist.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {artist.location}
                  </span>
                )}
                {artist.memberSince && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    Desde {new Date(artist.memberSince).toLocaleDateString("es-CO", { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>

            {socials.length > 0 && (
              <div className="flex gap-2 sm:pb-1">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                    aria-label={s.label}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-zinc-300 hover:text-emerald-300 transition"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 sm:px-7 pb-6 grid grid-cols-2 gap-3 max-w-md">
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-3">
              <Disc3 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-lg font-extrabold leading-none">{formatCount(artist.tracksCount)}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Beats</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-3">
              <Headphones className="w-5 h-5 text-teal-400" />
              <div>
                <p className="text-lg font-extrabold leading-none">{formatCount(artist.totalPlays)}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Reproducciones</p>
              </div>
            </div>
          </div>

          {artist.bio && (
            <div className="px-5 sm:px-7 pb-7">
              <h2 className="text-sm font-bold text-zinc-200 mb-1.5">Biografía</h2>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{artist.bio}</p>
            </div>
          )}
        </section>

        {/* BEATS */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Beats de {artist.artistName}</h2>

          {tracks.length === 0 ? (
            <div className="bg-[#0c1217] border border-white/5 rounded-2xl p-8 text-center text-sm text-zinc-500">
              Este artista aún no ha publicado beats.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {tracks.map((track) => {
                const cover = fullUrl(track.coverUrl);
                const playingThis = currentTrack?.id === track.id && isPlaying;
                const purchased = !!token && purchasedIds.has(track.id);
                const fav = isFavorite(track.id);
                return (
                  <li
                    key={track.id}
                    className="flex items-center gap-3 sm:gap-4 bg-[#0f151c]/90 border border-emerald-500/10 hover:border-emerald-500/30 rounded-2xl p-3 transition"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-emerald-500/15">
                      {cover ? (
                        <img src={cover} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-400">
                          <Music className="w-6 h-6" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => playTrack(track, tracks)}
                        aria-label={playingThis ? "Pausar" : "Reproducir"}
                        className={`absolute inset-0 m-auto w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
                          playingThis
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-black/70 text-white hover:bg-emerald-400 hover:text-slate-950"
                        }`}
                      >
                        {playingThis ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm sm:text-base truncate">{track.title}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                        {track.genre && (
                          <span className="text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            {track.genre}
                          </span>
                        )}
                        {track.bpm && (
                          <span className="font-mono text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                            {track.bpm} BPM
                          </span>
                        )}
                        {track.key && (
                          <span className="font-mono text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                            {track.key}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Headphones className="w-3 h-3" />
                          {formatCount(track.playsCount ?? 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwner ? (
                        <>
                          <span className="hidden sm:inline text-sm font-extrabold text-emerald-400">
                            ${Number(track.price).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setTrackToEdit(track)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(track)}
                            aria-label={fav ? "Quitar de favoritos" : "Guardar en favoritos"}
                            className={`p-2 rounded-xl border transition cursor-pointer ${
                              fav
                                ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                : "bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border-white/10"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${fav ? "fill-rose-500" : ""}`} />
                          </button>
                          {purchased ? (
                            <button
                              type="button"
                              onClick={() => handleDownload(track)}
                              disabled={downloadingId === track.id}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {downloadingId === track.id ? "..." : "Descargar"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBuy(track)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 border border-emerald-300/30 transition cursor-pointer"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              ${Number(track.price).toFixed(2)}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <PaymentSimulationModal
        isOpen={!!trackToPay}
        onClose={() => setTrackToPay(null)}
        track={trackToPay}
        onSuccess={() => {
          loadPurchases();
        }}
      />

      {trackToEdit && (
        <EditBeatModal
          key={trackToEdit.id}
          track={trackToEdit}
          onClose={() => setTrackToEdit(null)}
          onSaved={(updated) => {
            setTracks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
            setTrackToEdit(null);
          }}
          onDeleted={(deletedId) => {
            setTracks((prev) => prev.filter((t) => t.id !== deletedId));
            setArtist((a) => (a ? { ...a, tracksCount: Math.max(0, a.tracksCount - 1) } : a));
            setTrackToEdit(null);
          }}
        />
      )}
    </div>
  );
}
