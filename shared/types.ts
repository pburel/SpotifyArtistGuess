export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  genres: string[];
  popularity: number;
  followers: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface GameState {
  isGameActive: boolean;
  targetArtist: ArtistWithDetails | null;
  attemptsLeft: number;
  maxAttempts: number;
  previousGuesses: ArtistWithDetails[];
  isCorrect: boolean | null;
  score: number;
  hintIndex: number;
}

export interface ArtistWithDetails {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
  popularity: number;
  monthlyListeners?: number;
}

export interface GameResult {
  isCorrect: boolean;
  attemptsUsed: number;
  targetArtist: ArtistWithDetails;
  score: number;
}
