import { Artist } from "@shared/schema";
import { ArtistWithDetails, GameState, GameResult } from "@shared/types";
import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";

export const MAX_ATTEMPTS = 5;

export async function startNewGame(): Promise<GameState> {
  // Initialize the artists database if needed
  try {
    await apiRequest("GET", "/api/initialize");
  } catch (error) {
    console.error("Error initializing artists:", error);
  }

  // Get a random artist for the game
  const response = await apiRequest("GET", "/api/game/random-artist");
  const data = await response.json();
  
  if (!data.success) {
    throw new Error("Failed to get random artist");
  }
  
  console.log("New game started with target artist:", data.artist.name);
  
  return {
    isGameActive: true,
    targetArtist: data.artist,
    attemptsLeft: MAX_ATTEMPTS,
    maxAttempts: MAX_ATTEMPTS,
    previousGuesses: [],
    isCorrect: null,
    score: 0,
    hintIndex: 0
  };
}

export function processGuess(state: GameState, guessedArtist: ArtistWithDetails): GameState {
  if (!state.isGameActive || !state.targetArtist) {
    throw new Error("No active game");
  }
  
  // Already guessed this artist
  if (state.previousGuesses.some(artist => artist.id === guessedArtist.id)) {
    return state;
  }

  const isCorrect = guessedArtist.id === state.targetArtist.id;
  const attemptsLeft = state.attemptsLeft - 1;
  const isGameOver = isCorrect || attemptsLeft <= 0;
  
  // Calculate score - more points for fewer attempts used
  let score = state.score;
  if (isCorrect) {
    // Base score is 100 multiplied by attempts remaining + 1
    score += 100 * (attemptsLeft + 1);
  }

  return {
    ...state,
    isGameActive: !isGameOver,
    attemptsLeft,
    previousGuesses: [guessedArtist, ...state.previousGuesses],
    isCorrect: isGameOver ? isCorrect : null,
    score,
    hintIndex: isGameOver ? state.hintIndex : state.hintIndex + 1
  };
}

export async function submitGameResult(result: GameResult): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    
    await apiRequest("POST", "/api/game/result", {
      userId: null, // Anonymous for now
      targetArtistId: result.targetArtist.id,
      attemptsUsed: result.attemptsUsed,
      isCorrect: result.isCorrect,
      score: result.score,
      timestamp
    });
    
    // Invalidate any game-related caches
    queryClient.invalidateQueries({ queryKey: ['/api/game'] });
  } catch (error) {
    console.error("Error submitting game result:", error);
  }
}

export function generateHint(state: GameState): string {
  if (!state.targetArtist) return "";
  
  const hints = [
    `This artist has ${formatNumber(state.targetArtist.monthlyListeners || 0)} monthly listeners`,
    `This artist's genres include ${formatGenres(state.targetArtist.genres)}`,
    `This artist has a popularity rating of ${state.targetArtist.popularity}/100`,
    `The artist name starts with "${state.targetArtist.name.charAt(0)}"`,
    `The artist name has ${state.targetArtist.name.length} characters`
  ];
  
  return hints[Math.min(state.hintIndex, hints.length - 1)];
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatGenres(genres: string[]): string {
  if (!genres || genres.length === 0) return "unknown genres";
  
  if (genres.length === 1) {
    return genres[0];
  }
  
  if (genres.length === 2) {
    return `${genres[0]} and ${genres[1]}`;
  }
  
  return `${genres[0]}, ${genres[1]}, and others`;
}
