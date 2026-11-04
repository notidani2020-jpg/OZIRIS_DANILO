export interface Artist {
  id: string;
  artisticName: string;
  bio?: string | null;
  genre?: string | null;
  bannerUrl?: string | null;
  spotifyUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  verified: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  lastName?: string | null;
  artistName?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  email: string;
  role: 'ADMIN' | 'USER' | 'PRODUCER' | 'BUYER' | string;
  bio?: string | null;
  isActive?: boolean;
  artist?: Artist | null;
  createdAt?: string;
  updatedAt?: string;
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
  producer?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    artistName?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicArtist {
  id: string;
  name: string;
  artistName: string;
  avatarUrl: string | null;
  location: string | null;
  bio: string | null;
  genre: string | null;
  bannerUrl: string | null;
  spotifyUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  verified: boolean;
  tracksCount: number;
  totalPlays: number;
  memberSince: string | null;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProducers: number;
  totalTracks: number;
  totalSales: number;
  totalRevenue: number;
}

export interface Purchase {
  id: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  licenseType?: string;
  transactionId?: string;
  trackId?: string;
  userId?: string;
  downloadCount?: number;
  lastDownloadedAt?: string | null;
  payerName?: string | null;
  payerEmail?: string | null;
  paymentProvider?: string | null;
  createdAt: string;
  track?: Track;
  downloadUrl?: string;
}

export interface PaymentSimulationResponse {
  success: boolean;
  message: string;
  transactionId: string;
  paymentMethod: string;
  licenseType: string;
  purchasedAt: string;
  purchases: Array<{
    id: string;
    trackId: string;
    trackTitle: string;
    amount: number;
    status: string;
    paymentMethod: string;
    licenseType: string;
    transactionId: string;
    createdAt: string;
    downloadUrl: string;
    alreadyOwned: boolean;
  }>;
}
