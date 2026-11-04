"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { Track } from "@/types";
import { API_URL } from "@/services/config";
import { registerPlayApi } from "@/services/trackService";

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  queue: Track[];
  queueIndex: number;
  audioError: string | null;
  playTrack: (track: Track, playlist?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seekTo: (timeInSeconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  closePlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLoopingRef = useRef(isLooping);
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const prevVolumeRef = useRef<number>(0.8);

  // Keep refs in sync
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  // Format full audio url helper
  const getFullAudioUrl = (audioUrl: string) => {
    if (!audioUrl) return "";
    if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://") || audioUrl.startsWith("blob:")) {
      return audioUrl;
    }
    return `${API_URL}${audioUrl.startsWith("/") ? "" : "/"}${audioUrl}`;
  };

  const nextTrack = useCallback(() => {
    const q = queueRef.current;
    const qIdx = queueIndexRef.current;
    if (q.length === 0) {
      setIsPlaying(false);
      return;
    }
    const nextIdx = qIdx + 1;
    if (nextIdx < q.length) {
      const next = q[nextIdx];
      setQueueIndex(nextIdx);
      playTrack(next, q);
    } else {
      if (q.length > 1) {
        setQueueIndex(0);
        playTrack(q[0], q);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }
  }, []);

  const prevTrack = useCallback(() => {
    const q = queueRef.current;
    const qIdx = queueIndexRef.current;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (q.length === 0) return;
    const prevIdx = qIdx - 1;
    if (prevIdx >= 0) {
      const prev = q[prevIdx];
      setQueueIndex(prevIdx);
      playTrack(prev, q);
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    }
  }, []);

  // Initialize Audio element ONCE on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime || 0);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration || 0);
      }
    };

    const handleEnded = () => {
      if (isLoopingRef.current && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } else {
        nextTrack();
      }
    };

    const handleError = () => {
      setAudioError("No se pudo cargar o reproducir el archivo de audio.");
      setIsPlaying(false);
      setTimeout(() => setAudioError(null), 4000);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, [nextTrack]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const playTrack = (track: Track, playlist?: Track[]) => {
    if (!audioRef.current) return;
    setAudioError(null);

    // If clicking on same track that is already loaded
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    if (playlist && playlist.length > 0) {
      setQueue(playlist);
      const idx = playlist.findIndex((t) => t.id === track.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else {
      setQueue([track]);
      setQueueIndex(0);
    }

    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(0);
    registerPlayApi(track.id);

    const fullUrl = getFullAudioUrl(track.audioUrl);
    audioRef.current.src = fullUrl;
    audioRef.current.load();

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.error("Audio play error:", err);
        setAudioError(`Error al reproducir "${track.title}".`);
        setIsPlaying(false);
        setTimeout(() => setAudioError(null), 4000);
      });
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Audio resume error:", err);
          setIsPlaying(false);
        });
    }
  };

  const pause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resume = () => {
    if (audioRef.current && !isPlaying && currentTrack) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const seekTo = (timeInSeconds: number) => {
    if (!audioRef.current) return;
    const targetTime = Math.max(0, Math.min(timeInSeconds, duration || 0));
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const seekBy = (deltaSeconds: number) => {
    if (!audioRef.current) return;
    const targetTime = Math.max(0, Math.min(currentTime + deltaSeconds, duration || 0));
    seekTo(targetTime);
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolumeState(prevVolumeRef.current || 0.8);
    } else {
      prevVolumeRef.current = volume;
      setIsMuted(true);
    }
  };

  const toggleLoop = () => {
    setIsLooping((prev) => !prev);
  };

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isLooping,
        queue,
        queueIndex,
        audioError,
        playTrack,
        togglePlay,
        pause,
        resume,
        seekTo,
        seekBy,
        nextTrack,
        prevTrack,
        setVolume,
        toggleMute,
        toggleLoop,
        closePlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
