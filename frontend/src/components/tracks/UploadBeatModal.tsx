"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Music, Image as ImageIcon, CheckCircle, AlertCircle, Play, Pause, Loader2 } from 'lucide-react';
import { uploadBeat, Track } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

//cambio hecho mio

interface UploadBeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTrack: Track) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function UploadBeatModal({ isOpen, onClose, onSuccess }: UploadBeatModalProps) {
  const { user, token, isArtist } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('Trap');
  const [bpm, setBpm] = useState<string>('120');
  const [keySignature, setKeySignature] = useState('C Minor');
  const [price, setPrice] = useState<string>('29.99');
  const [tags, setTags] = useState('');

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Generate audio preview URL when file changes
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioPreviewUrl(null);
    }
  }, [audioFile]);

  // Generate cover preview URL when file changes
  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCoverPreviewUrl(null);
    }
  }, [coverFile]);

  if (!isOpen || !isArtist) return null;

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setPreviewError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate by extension
    const validExts = ['mp3', 'wav'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !validExts.includes(fileExt)) {
      setErrorMessage('Por favor selecciona un archivo de audio válido (.mp3 o .wav).');
      return;
    }

    // Validate by MIME type (WhatsApp audio is .opus disguised as .mp3)
    const validMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav'];
    if (file.type && !validMimes.includes(file.type)) {
      setErrorMessage(`Formato no soportado (${file.type}). Por favor usa un archivo .mp3 o .wav real. Los audios de WhatsApp no son compatibles.`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('El archivo de audio no debe superar los 50 MB.');
      return;
    }

    setAudioFile(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !validExts.includes(fileExt)) {
      setErrorMessage('Formato de imagen no soportado (.jpg, .png, .webp).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('La imagen de portada no debe superar los 10 MB.');
      return;
    }

    setCoverFile(file);
  };

  const togglePlayPreview = () => {
    if (!audioRef.current) return;
    if (isPlayingPreview) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      setPreviewError(null);
      audioRef.current.play().then(() => {
        setIsPlayingPreview(true);
      }).catch((err) => {
        console.error('Error al reproducir preview:', err);
        setPreviewError('No se puede reproducir este archivo. Verifica que sea un MP3 o WAV válido.');
        setIsPlayingPreview(false);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('El título del Beat es obligatorio.');
      return;
    }

    if (!audioFile) {
      setErrorMessage('Debes seleccionar un archivo de audio (.mp3 o .wav).');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setErrorMessage('Ingresa un precio válido (mayor o igual a 0).');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('genre', genre);
      formData.append('bpm', bpm);
      formData.append('key', keySignature);
      formData.append('price', price);
      formData.append('tags', tags);
      formData.append('audio', audioFile);

      if (coverFile) {
        formData.append('cover', coverFile);
      } else if (user?.avatarUrl) {
        formData.append('coverUrl', user.avatarUrl);
      }

      if (!token) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');
      const newTrack = await uploadBeat(formData, token, (progress) => {
        setUploadProgress(progress);
      });

      setSuccessMessage('¡Tu Beat ha sido publicado con éxito en OZIRIS!');
      setIsSubmitting(false);

      setTimeout(() => {
        onSuccess(newTrack);
        onClose();
      }, 1200);

    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Ocurrió un error al intentar publicar el Beat.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090d10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Music className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Subir Nuevo Beat</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-300">
          
          {/* Mensajes de Alerta */}
          {errorMessage && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Carga de Archivos: Audio + Portada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Audio Dropzone */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-white flex items-center gap-1.5">
                Archivo de Audio <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                ref={audioInputRef}
                onChange={handleAudioChange}
                accept=".mp3,.wav,audio/mpeg,audio/wav"
                className="hidden"
              />

              {!audioFile ? (
                <div
                  onClick={() => audioInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/15 rounded-xl bg-white/[0.02] hover:bg-emerald-500/5 hover:border-emerald-500/40 transition cursor-pointer group text-center"
                >
                  <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-emerald-400 transition mb-2" />
                  <span className="font-medium text-white group-hover:text-emerald-300">Haz clic para subir Audio</span>
                  <span className="text-xs text-zinc-500 mt-1">MP3 o WAV (máx 50MB)</span>
                </div>
              ) : (
                <div className="p-4 border border-emerald-500/30 rounded-xl bg-emerald-500/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="truncate pr-2">
                      <p className="font-medium text-white truncate">{audioFile.name}</p>
                      <p className="text-xs text-zinc-400">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioFile(null);
                        setIsPlayingPreview(false);
                      }}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>

                  {/* Reproductor de Previsualización Local */}
                  {audioPreviewUrl && (
                    <div className="flex flex-col gap-2">
                      {!previewError ? (
                        <div className="flex items-center gap-3 bg-black/40 p-2 rounded-lg border border-white/10">
                          <button
                            type="button"
                            onClick={togglePlayPreview}
                            className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center justify-center shadow-md shadow-emerald-500/20"
                          >
                            {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>
                          <span className="text-xs font-medium text-zinc-300">
                            {isPlayingPreview ? 'Reproduciendo vista previa...' : 'Escuchar vista previa'}
                          </span>
                          <audio
                            ref={audioRef}
                            src={audioPreviewUrl}
                            onEnded={() => setIsPlayingPreview(false)}
                            onError={() => {
                              setPreviewError('Formato de audio no soportado por el navegador. El archivo se subirá igual.');
                              setIsPlayingPreview(false);
                            }}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{previewError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Portada Dropzone */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-white">Imagen de Portada (Opcional)</label>
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverChange}
                accept=".jpg,.jpeg,.png,.webp,image/*"
                className="hidden"
              />

              {!coverFile ? (
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-white/15 rounded-xl bg-white/[0.02] hover:bg-emerald-500/5 hover:border-emerald-500/40 transition cursor-pointer group text-center"
                >
                  {user?.avatarUrl ? (
                    <div className="flex items-center gap-3 mb-2 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                      <img
                        src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_BASE_URL}${user.avatarUrl}`}
                        alt="Avatar"
                        className="w-10 h-10 object-cover rounded-lg border border-emerald-500/30 shrink-0"
                      />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-emerald-300">Foto de Perfil asignada por defecto</p>
                        <p className="text-[11px] text-zinc-400">Haz clic para elegir una portada diferente</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-emerald-400 transition mb-2" />
                      <span className="font-medium text-white group-hover:text-emerald-300">Seleccionar Portada</span>
                      <span className="text-xs text-zinc-500 mt-1">JPG, PNG o WEBP (máx 10MB)</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-3 border border-white/15 rounded-xl bg-white/[0.04] flex items-center gap-4">
                  {coverPreviewUrl && (
                    <img
                      src={coverPreviewUrl}
                      alt="Cover Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                    />
                  )}
                  <div className="flex-1 truncate">
                    <p className="font-medium text-white truncate text-xs">{coverFile.name}</p>
                    <p className="text-[11px] text-zinc-400">{(coverFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCoverFile(null)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-semibold text-white">Nombre del Beat <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Midnight Dreams"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="font-semibold text-white">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Detalles sobre el estilo, instrumentos o inspiración..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white">Género Musical</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#10171e] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Trap">Trap</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Reggaeton">Reggaeton</option>
                <option value="RnB">R&B</option>
                <option value="Dancehall">Dancehall</option>
                <option value="Pop">Pop</option>
                <option value="Afrobeats">Afrobeats</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white">Precio ($ USD) <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white">BPM</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="120"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white">Tonalidad / Key</label>
              <input
                type="text"
                value={keySignature}
                onChange={(e) => setKeySignature(e.target.value)}
                placeholder="Ej. C Minor, F# Major"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="font-semibold text-white">Etiquetas (separadas por coma)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ej. drake, dark, hard, 808"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Barra de Progreso de Subida */}
          {isSubmitting && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-medium text-emerald-300">
                <span>Subiendo archivos a OZIRIS...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-zinc-300 font-medium transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-slate-950" />
                  <span>Publicar Beat</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
