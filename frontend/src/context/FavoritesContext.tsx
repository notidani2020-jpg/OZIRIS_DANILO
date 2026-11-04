"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Track } from "@/types";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { fetchFavoritesApi, toggleFavoriteApi } from "@/services/userService";

interface FavoritesContextType {
  favorites: Track[];
  isFavoritesOpen: boolean;
  isLoading: boolean;
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (track: Track) => Promise<boolean>;
  openFavorites: () => void;
  closeFavorites: () => void;
  toggleFavoritesDrawer: () => void;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setFavorites([]);
      return;
    }
    try {
      setIsLoading(true);
      const data = await fetchFavoritesApi(token);
      if (Array.isArray(data)) {
        setFavorites(data);
      }
    } catch (err) {
      console.error("Error al cargar favoritos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated, token, loadFavorites]);

  const isFavorite = useCallback(
    (trackId: string) => {
      return favorites.some((f) => f.id === trackId);
    },
    [favorites]
  );

  const toggleFavorite = async (track: Track): Promise<boolean> => {
    if (!token || !isAuthenticated) {
      showToast("info", "Inicia sesión para guardar tus Beats en favoritos.");
      return false;
    }

    const currentlyFav = isFavorite(track.id);

    // Optimistic UI update
    if (currentlyFav) {
      setFavorites((prev) => prev.filter((f) => f.id !== track.id));
    } else {
      setFavorites((prev) => [track, ...prev.filter((f) => f.id !== track.id)]);
    }

    try {
      const res = await toggleFavoriteApi(token, track.id);
      // If server returned boolean state, sync if needed
      if (res.isFavorite) {
        setFavorites((prev) => (prev.some((f) => f.id === track.id) ? prev : [track, ...prev]));
      } else {
        setFavorites((prev) => prev.filter((f) => f.id !== track.id));
      }
      return res.isFavorite;
    } catch (err) {
      console.error("Error al actualizar favorito en servidor:", err);
      // Rollback on error
      if (currentlyFav) {
        setFavorites((prev) => [track, ...prev]);
      } else {
        setFavorites((prev) => prev.filter((f) => f.id !== track.id));
      }
      return currentlyFav;
    }
  };

  const openFavorites = () => setIsFavoritesOpen(true);
  const closeFavorites = () => setIsFavoritesOpen(false);
  const toggleFavoritesDrawer = () => setIsFavoritesOpen((prev) => !prev);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavoritesOpen,
        isLoading,
        isFavorite,
        toggleFavorite,
        openFavorites,
        closeFavorites,
        toggleFavoritesDrawer,
        refreshFavorites: loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
