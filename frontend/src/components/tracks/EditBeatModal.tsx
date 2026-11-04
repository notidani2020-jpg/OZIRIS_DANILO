"use client";

import React, { useState } from "react";
import { X, Save, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Track, updateTrackApi, deleteTrackApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface EditBeatModalProps {
  track: Track;
  onClose: () => void;
  onSaved: (track: Track) => void;
  onDeleted: (trackId: string) => void;
}

const GENRES = ["Trap", "Reggaeton", "Drill", "Hip Hop", "R&B", "Afrobeat", "Dancehall", "Lo-Fi", "Pop", "Otro"];

const inputCls =
  "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50";

function errMsg(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Se monta solo mientras hay un beat en edición, así el estado nace con sus datos. */
export default function EditBeatModal({ track, onClose, onSaved, onDeleted }: EditBeatModalProps) {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState(track.title);
  const [description, setDescription] = useState(track.description || "");
  const [price, setPrice] = useState(String(track.price));
  const [genre, setGenre] = useState(track.genre || "");
  const [bpm, setBpm] = useState(track.bpm ? String(track.bpm) : "");
  const [keySignature, setKeySignature] = useState(track.key || "");
  const [tags, setTags] = useState((track.tags || []).join(", "));

  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");

    const priceNum = Number(price);
    if (!title.trim()) return setError("El título es obligatorio.");
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError("Ingresa un precio válido.");
    const bpmNum = bpm ? Number(bpm) : undefined;
    if (bpmNum !== undefined && (!Number.isInteger(bpmNum) || bpmNum < 30 || bpmNum > 300)) {
      return setError("El BPM debe ser un entero entre 30 y 300.");
    }

    try {
      setIsSaving(true);
      const updated = await updateTrackApi(token, track.id, {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        genre: genre || undefined,
        bpm: bpmNum,
        key: keySignature.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      showToast("success", "Beat actualizado.");
      onSaved(updated);
    } catch (err) {
      setError(errMsg(err, "Error al actualizar el Beat."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    try {
      setIsDeleting(true);
      await deleteTrackApi(token, track.id);
      showToast("success", `Beat "${track.title}" eliminado.`);
      onDeleted(track.id);
    } catch (err) {
      setError(errMsg(err, "Error al eliminar el Beat."));
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#090d10] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold">Editar Beat</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Título</label>
            <input
              className={inputCls}
              value={title}
              maxLength={150}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Descripción</label>
            <textarea
              rows={3}
              className={`${inputCls} resize-none`}
              value={description}
              maxLength={1000}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Precio (USD)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputCls}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Género</label>
              <select className={inputCls} value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option value="" className="bg-[#090d10]">Sin género</option>
                {genre && !GENRES.includes(genre) && (
                  <option value={genre} className="bg-[#090d10]">{genre}</option>
                )}
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-[#090d10]">{g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">BPM</label>
              <input
                type="number"
                min={30}
                max={300}
                className={inputCls}
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Tonalidad</label>
              <input
                className={inputCls}
                value={keySignature}
                maxLength={30}
                placeholder="Ej. C Minor"
                onChange={(e) => setKeySignature(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Etiquetas (separadas por coma)</label>
            <input
              className={inputCls}
              value={tags}
              placeholder="dark, 808, melodic"
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <p className="text-[11px] text-zinc-500">
            El audio y la portada no se pueden cambiar desde aquí. Para reemplazarlos, sube el beat de nuevo.
          </p>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
            {confirmDelete ? (
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-zinc-300">¿Eliminar definitivamente?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar beat
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
