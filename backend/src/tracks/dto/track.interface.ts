export interface TrackProducer {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  artistName?: string | null;
}

export interface Track {
  id: string;
  title: string;
  description?: string;
  price: number;
  genre?: string;
  bpm?: number;
  key?: string;
  tags?: string[];
  audioUrl: string;
  fullAudioUrl?: string;
  coverUrl?: string;
  playsCount?: number;
  downloadsCount?: number;
  producerId: string;
  producer?: TrackProducer;
  createdAt: string;
  updatedAt: string;
}
