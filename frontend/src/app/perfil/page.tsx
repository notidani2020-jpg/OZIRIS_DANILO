"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  MapPin,
  Mic,
  Camera,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  Shield,
  BadgeCheck,
  Music2,
  ImageIcon,
  Link2,
  Lock,
  AtSign,
  PlayCircle,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types";
import {
  updateProfileApi,
  uploadAvatarApi,
  uploadBannerApi,
  changePasswordApi,
} from "@/services/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const GENRES = [
  "Trap",
  "Reggaeton",
  "Drill",
  "Hip Hop",
  "R&B",
  "Afrobeat",
  "Dancehall",
  "Lo-Fi",
  "Pop",
  "Otro",
];

const BIO_MAX = 500;

function errMsg(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function fullUrl(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const inputBase =
  "w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50";

function Field({
  label,
  icon,
  children,
  error,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-300">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        {children}
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#0c1217] border border-emerald-500/10 rounded-3xl p-5 sm:p-7 space-y-5">
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {description && (
          <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const { token, updateCurrentUser, isAdmin, isArtist } = useAuth();

  const [name, setName] = useState(user.name || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [artistName, setArtistName] = useState(user.artistName || "");
  const [location, setLocation] = useState(user.location || "");
  const [bio, setBio] = useState(user.bio || "");
  const [genre, setGenre] = useState(user.artist?.genre || "");
  const [spotifyUrl, setSpotifyUrl] = useState(user.artist?.spotifyUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(user.artist?.instagramUrl || "");
  const [youtubeUrl, setYoutubeUrl] = useState(user.artist?.youtubeUrl || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user.avatarUrl || null,
  );
  const [bannerUrl, setBannerUrl] = useState<string | null>(
    user.artist?.bannerUrl || null,
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    try {
      setIsUploadingAvatar(true);
      const res = await uploadAvatarApi(token, file);
      setAvatarUrl(res.avatarUrl || null);
      updateCurrentUser({ avatarUrl: res.avatarUrl });
      showNotification("success", "Foto de perfil actualizada.");
    } catch (err) {
      showNotification("error", errMsg(err, "Error al subir la imagen."));
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    try {
      setIsUploadingBanner(true);
      const res = await uploadBannerApi(token, file);
      setBannerUrl(res.artist?.bannerUrl || null);
      updateCurrentUser({ artist: res.artist });
      showNotification("success", "Banner actualizado.");
    } catch (err) {
      showNotification("error", errMsg(err, "Error al subir el banner."));
    } finally {
      setIsUploadingBanner(false);
      e.target.value = "";
    }
  };

  const passwordError =
    newPassword && newPassword.length < 6
      ? "La nueva contraseña debe tener al menos 6 caracteres."
      : confirmPassword && newPassword !== confirmPassword
        ? "Las contraseñas no coinciden."
        : "";
  const canChangePassword =
    !!currentPassword && newPassword.length >= 6 && newPassword === confirmPassword;

  const handleChangePassword = async () => {
    if (!token || !canChangePassword || isChangingPassword) return;
    try {
      setIsChangingPassword(true);
      const res = await changePasswordApi(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showNotification("success", res.message);
    } catch (err) {
      showNotification("error", errMsg(err, "Error al cambiar la contraseña."));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onPasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleChangePassword();
    }
  };

  const urlErrors = {
    spotify: isValidUrl(spotifyUrl) ? "" : "Ingresa una URL válida (https://...)",
    instagram: isValidUrl(instagramUrl) ? "" : "Ingresa una URL válida (https://...)",
    youtube: isValidUrl(youtubeUrl) ? "" : "Ingresa una URL válida (https://...)",
  };
  const hasUrlErrors = isArtist && Object.values(urlErrors).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || hasUrlErrors) return;

    try {
      setIsSaving(true);
      const payload: Parameters<typeof updateProfileApi>[1] = {
        name,
        lastName,
        location,
        bio,
      };
      if (isArtist) {
        payload.artistName = artistName;
        payload.genre = genre;
        payload.spotifyUrl = spotifyUrl.trim();
        payload.instagramUrl = instagramUrl.trim();
        payload.youtubeUrl = youtubeUrl.trim();
      }
      const updated = await updateProfileApi(token, payload);

      updateCurrentUser({
        name: updated.name,
        lastName: updated.lastName,
        artistName: updated.artistName,
        location: updated.location,
        bio: updated.bio,
        artist: updated.artist,
      });
      showNotification("success", "¡Perfil guardado con éxito!");
    } catch (err) {
      showNotification("error", errMsg(err, "Error al guardar el perfil."));
    } finally {
      setIsSaving(false);
    }
  };

  const avatarSrc = fullUrl(avatarUrl);
  const bannerSrc = fullUrl(bannerUrl);
  const roleLabel = isAdmin
    ? "ADMINISTRADOR"
    : isArtist
      ? "ARTISTA / PRODUCTOR"
      : "USUARIO / OYENTE";
  const displayName = isArtist && artistName ? artistName : name;

  return (
    <div className="min-h-screen bg-[#090d10] text-white">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 bg-[#090d10]/90 backdrop-blur-md border-b border-emerald-500/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/inicio"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-4">
            {isArtist && (
              <Link
                href={`/artista/${user.id}`}
                className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full transition"
              >
                Ver mi perfil público
              </Link>
            )}
            <span className="hidden sm:inline text-sm font-bold tracking-tight">
              {isArtist ? "Mi Perfil de Artista" : "Mi Perfil de Usuario"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {notification && (
          <div
            role="status"
            className={`mb-5 flex items-center gap-3 p-4 rounded-2xl border text-sm ${
              notification.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : "bg-red-950/90 border-red-500/40 text-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BANNER + AVATAR */}
          <div className="bg-[#0c1217] border border-emerald-500/10 rounded-3xl overflow-hidden">
            {isArtist ? (
              <div className="relative h-36 sm:h-52 bg-gradient-to-br from-[#122421] to-[#0c181f] group">
                {bannerSrc && (
                  <img
                    src={bannerSrc}
                    alt="Banner del artista"
                    className="w-full h-full object-cover"
                  />
                )}
                <label
                  htmlFor="banner-upload"
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex flex-col items-center justify-center gap-1 cursor-pointer transition"
                >
                  {isUploadingBanner ? (
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-emerald-300" />
                      <span className="text-xs font-semibold">
                        {bannerSrc ? "Cambiar banner" : "Subir banner"}
                      </span>
                    </>
                  )}
                </label>
                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  disabled={isUploadingBanner}
                  className="sr-only"
                />
              </div>
            ) : (
              <div className="h-20 sm:h-28 bg-gradient-to-br from-[#122421] to-[#0c181f]" />
            )}

            <div className="px-5 sm:px-7 pb-6 -mt-12 sm:-mt-14 flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#0c1217] bg-zinc-900 shadow-xl group shrink-0">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#122421] to-[#0c181f] text-emerald-300 font-extrabold text-3xl">
                    {name ? name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex flex-col items-center justify-center cursor-pointer transition"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mb-0.5 text-emerald-300" />
                      <span className="text-[10px] font-semibold">Cambiar</span>
                    </>
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                  className="sr-only"
                />
              </div>

              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold truncate">
                    {displayName || "Tu perfil"}
                  </h1>
                  {isArtist && user?.artist?.verified && (
                    <span
                      title="Artista verificado"
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Verificado
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span
                      className={`font-bold ${isArtist ? "text-teal-300" : "text-emerald-300"}`}
                    >
                      {roleLabel}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DATOS PERSONALES */}
          <Section
            title="Datos personales"
            description="Información básica de tu cuenta."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Nombre"
                icon={<UserIcon className="h-4 w-4 text-zinc-500" />}
              >
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan"
                  className={`${inputBase} pl-10 pr-3`}
                />
              </Field>
              <Field
                label="Apellido"
                icon={<UserIcon className="h-4 w-4 text-zinc-500" />}
              >
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej. Pérez"
                  className={`${inputBase} pl-10 pr-3`}
                />
              </Field>
              <Field
                label="Ubicación (Ciudad / País)"
                icon={<MapPin className="h-4 w-4 text-zinc-500" />}
              >
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej. Medellín, Colombia"
                  className={`${inputBase} pl-10 pr-3`}
                />
              </Field>
            </div>

            {!isArtist && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Biografía / Reseña
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos un poco sobre ti y tus gustos musicales..."
                  className={`${inputBase} p-3 resize-none`}
                />
              </div>
            )}
          </Section>

          {/* SECCIONES SOLO ARTISTA */}
          {isArtist ? (
            <>
              <Section
                title="Identidad artística"
                description="Cómo te verán los compradores en el catálogo."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Nombre de Artista / Productor"
                    icon={<Mic className="h-4 w-4 text-emerald-400" />}
                  >
                    <input
                      type="text"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Ej. OZIRIS Lil Trap"
                      className={`${inputBase} pl-10 pr-3 bg-emerald-500/5 border-emerald-500/20`}
                    />
                  </Field>
                  <Field
                    label="Género principal"
                    icon={<Music2 className="h-4 w-4 text-zinc-500" />}
                  >
                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className={`${inputBase} pl-10 pr-3 appearance-none`}
                    >
                      <option value="" className="bg-[#090d10]">
                        Selecciona un género
                      </option>
                      {GENRES.map((g) => (
                        <option key={g} value={g} className="bg-[#090d10]">
                          {g}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      Biografía del artista
                    </label>
                    <span
                      className={`text-[11px] ${bio.length > BIO_MAX ? "text-red-400" : "text-zinc-500"}`}
                    >
                      {bio.length}/{BIO_MAX}
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    maxLength={BIO_MAX}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Cuenta tu historia, estilo, influencias y colaboraciones..."
                    className={`${inputBase} p-3 resize-none`}
                  />
                </div>
              </Section>

              <Section
                title="Redes y plataformas"
                description="Enlaces que se mostrarán en tu perfil público."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Spotify"
                    icon={<Link2 className="h-4 w-4 text-zinc-500" />}
                    error={urlErrors.spotify}
                  >
                    <input
                      type="url"
                      value={spotifyUrl}
                      onChange={(e) => setSpotifyUrl(e.target.value)}
                      placeholder="https://open.spotify.com/artist/..."
                      className={`${inputBase} pl-10 pr-3`}
                    />
                  </Field>
                  <Field
                    label="Instagram"
                    icon={<AtSign className="h-4 w-4 text-zinc-500" />}
                    error={urlErrors.instagram}
                  >
                    <input
                      type="url"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/tu_usuario"
                      className={`${inputBase} pl-10 pr-3`}
                    />
                  </Field>
                  <Field
                    label="YouTube"
                    icon={<PlayCircle className="h-4 w-4 text-zinc-500" />}
                    error={urlErrors.youtube}
                  >
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/@tu_canal"
                      className={`${inputBase} pl-10 pr-3`}
                    />
                  </Field>
                </div>
              </Section>
            </>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              Cuenta de Oyente: puedes explorar, escuchar beats y comprar
              licencias oficiales. La subida y venta de instrumentales está
              habilitada exclusivamente para perfiles de Artista.
            </div>
          )}

          {/* SEGURIDAD */}
          <Section
            title="Seguridad"
            description="Cambia tu contraseña de acceso."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Contraseña actual"
                icon={<Lock className="h-4 w-4 text-zinc-500" />}
              >
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onKeyDown={onPasswordKeyDown}
                  className={`${inputBase} pl-10 pr-3`}
                />
              </Field>
              <Field
                label="Nueva contraseña"
                icon={<Lock className="h-4 w-4 text-zinc-500" />}
              >
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={onPasswordKeyDown}
                  className={`${inputBase} pl-10 pr-3`}
                />
              </Field>
              <Field
                label="Confirmar nueva contraseña"
                icon={<Lock className="h-4 w-4 text-zinc-500" />}
                error={passwordError}
              >
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={onPasswordKeyDown}
                  className={`${inputBase} pl-10 pr-3`}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={!canChangePassword || isChangingPassword}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold px-5 py-2 rounded-xl text-sm transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                Cambiar contraseña
              </button>
            </div>
          </Section>

          {/* ACCIONES */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/inicio")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || hasUrlErrors}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  if (!user) return null;
  return <ProfileForm key={user.id} user={user} />;
}

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
