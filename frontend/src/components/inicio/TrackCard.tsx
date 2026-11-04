"use client";

import React from "react";
import Link from "next/link";
import { Music, Play, Pause, Heart, Download, ShoppingBag } from "lucide-react";
import { Track } from "@/services/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface TrackCardProps {
  track: Track;
  isPlaying: boolean;
  onPlay: (track: Track) => void;
  onSelectGenre: (genre?: string) => void;
  onSelectTag: (tag: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (track: Track) => void;
  isPurchased: boolean;
  isDownloading: boolean;
  onDownload: (track: Track) => void;
  onBuy: (track: Track) => void;
  isInCart: boolean;
}

export default function TrackCard({
  track,
  isPlaying,
  onPlay,
  onSelectGenre,
  onSelectTag,
  isFavorite,
  onToggleFavorite,
  isPurchased,
  isDownloading,
  onDownload,
  onBuy,
  isInCart,
}: TrackCardProps) {
  const coverPath = track.coverUrl
    ? track.coverUrl.startsWith("http")
      ? track.coverUrl
      : `${API_BASE_URL}${track.coverUrl}`
    : null;

  return (
    <div className="group relative bg-[#0f151c]/90 border border-emerald-500/10 hover:border-emerald-500/35 rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_12px_35px_rgba(16,185,129,0.12)] hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm">
      {/* INFORMACIÓN PRINCIPAL */}
      <div className="flex gap-4 items-start">
        {/* COVER */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-emerald-500/15 group-hover:border-emerald-500/40 transition duration-300 shadow-md">
          {coverPath ? (
            <img
              src={coverPath}
              alt={track.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#122421] to-[#0c181f] text-emerald-300">
              <Music className="w-8 h-8 text-emerald-400" />
            </div>
          )}

          {/* PLAY BUTTON */}
          <button
            onClick={() => onPlay(track)}
            type="button"
            className={`absolute inset-0 m-auto w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer ${
              isPlaying
                ? "bg-emerald-400 text-slate-950 scale-100 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                : "bg-black/70 text-white opacity-90 group-hover:opacity-100 hover:scale-110 hover:bg-emerald-400 hover:text-slate-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* METADATA */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onSelectGenre(track.genre)}
              className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-0.5 rounded-full border border-emerald-500/25 transition cursor-pointer"
            >
              {track.genre || "Beat"}
            </button>

            <span className="text-sm font-extrabold text-emerald-400">
              ${Number(track.price).toFixed(2)}
            </span>
          </div>

          <h4 className="font-bold text-white text-base truncate mt-1.5 group-hover:text-emerald-300 transition">
            {track.title}
          </h4>

          <p className="text-xs text-zinc-400 truncate mt-0.5">
            Por{" "}
            {track.producerId ? (
              <Link
                href={`/artista/${track.producerId}`}
                className="text-zinc-200 font-medium hover:text-emerald-300 hover:underline transition"
              >
                {track.producer?.artistName || track.producer?.name || "Productor OZIRIS"}
              </Link>
            ) : (
              <span className="text-zinc-200 font-medium">
                {track.producer?.name || "Productor OZIRIS"}
              </span>
            )}
          </p>

          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
            {track.bpm && (
              <span className="font-mono text-[11px] text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                {track.bpm} BPM
              </span>
            )}

            {track.key && (
              <span className="font-mono text-[11px] text-emerald-300/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {track.key}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TAGS + BOTONES */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        {/* TAGS */}
        <div className="flex gap-1.5 overflow-hidden max-w-[55%]">
          {track.tags && track.tags.length > 0 ? (
            track.tags.slice(0, 2).map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectTag(t)}
                className="text-[11px] text-zinc-400 hover:text-emerald-300 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/25 px-2 py-0.5 rounded-full truncate transition cursor-pointer"
              >
                #{t}
              </button>
            ))
          ) : (
            <span className="text-[11px] text-zinc-500 italic">
              OZIRIS Exclusive
            </span>
          )}
        </div>

        {/* BOTONES */}
        <div className="flex items-center gap-2">
          {/* CORAZÓN FAVORITO */}
          <button
            onClick={() => onToggleFavorite(track)}
            type="button"
            className={`p-2 rounded-xl transition transform active:scale-90 cursor-pointer ${
              isFavorite
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                : "bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10"
            }`}
            title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500" : ""}`} />
          </button>

          {/* DESCARGA O COMPRA */}
          {isPurchased ? (
            <button
              onClick={() => onDownload(track)}
              type="button"
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Descargar archivo de audio HQ"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? "Descargando..." : "Descargar"}</span>
            </button>
          ) : (
            <button
              onClick={() => onBuy(track)}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition transform hover:scale-105 active:scale-95 cursor-pointer ${
                isInCart
                  ? "bg-emerald-600 text-slate-950 font-bold border border-emerald-400/40"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-emerald-500/20 border border-emerald-300/30"
              }`}
              title="Comprar beat"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>${Number(track.price).toFixed(2)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
