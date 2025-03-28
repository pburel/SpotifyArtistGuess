import { artists, type Artist, type InsertArtist, gameHistory, type GameHistory, type InsertGameHistory, users, type User, type InsertUser } from "@shared/schema";
import { ArtistWithDetails } from "@shared/types";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Artist methods
  getAllArtists(): Promise<Artist[]>;
  getArtistById(id: string): Promise<Artist | undefined>;
  searchArtistsByName(query: string): Promise<Artist[]>;
  saveArtists(artists: InsertArtist[]): Promise<Artist[]>;
  getRandomArtist(): Promise<Artist | undefined>;
  
  // Game history methods
  saveGameHistory(history: InsertGameHistory): Promise<GameHistory>;
  getGameHistoryByUserId(userId: number): Promise<GameHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private artistsMap: Map<string, Artist>;
  private gameHistoryList: GameHistory[];
  currentUserId: number;
  currentArtistId: number;
  currentGameHistoryId: number;

  constructor() {
    this.users = new Map();
    this.artistsMap = new Map();
    this.gameHistoryList = [];
    this.currentUserId = 1;
    this.currentArtistId = 1;
    this.currentGameHistoryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllArtists(): Promise<Artist[]> {
    return Array.from(this.artistsMap.values());
  }

  async getArtistById(spotifyId: string): Promise<Artist | undefined> {
    return this.artistsMap.get(spotifyId) || 
      Array.from(this.artistsMap.values()).find(artist => artist.spotifyId === spotifyId);
  }

  async searchArtistsByName(query: string): Promise<Artist[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.artistsMap.values())
      .filter(artist => artist.name.toLowerCase().includes(lowerQuery))
      .slice(0, 10); // Limit results to 10
  }

  async saveArtists(artistsToSave: InsertArtist[]): Promise<Artist[]> {
    const savedArtists: Artist[] = [];
    
    for (const artistData of artistsToSave) {
      const existing = await this.getArtistById(artistData.spotifyId);
      
      if (existing) {
        // Update existing artist
        const updated: Artist = { 
          ...existing, 
          name: artistData.name,
          spotifyId: artistData.spotifyId,
          imageUrl: artistData.imageUrl || null,
          genres: artistData.genres || null,
          popularity: artistData.popularity || null,
          monthlyListeners: artistData.monthlyListeners || null
        };
        this.artistsMap.set(artistData.spotifyId, updated);
        savedArtists.push(updated);
      } else {
        // Create new artist
        const id = this.currentArtistId++;
        const newArtist: Artist = { 
          id,
          name: artistData.name,
          spotifyId: artistData.spotifyId,
          imageUrl: artistData.imageUrl || null,
          genres: artistData.genres || null,
          popularity: artistData.popularity || null,
          monthlyListeners: artistData.monthlyListeners || null
        };
        this.artistsMap.set(artistData.spotifyId, newArtist);
        savedArtists.push(newArtist);
      }
    }
    
    return savedArtists;
  }

  async getRandomArtist(): Promise<Artist | undefined> {
    const artists = Array.from(this.artistsMap.values());
    if (artists.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * artists.length);
    return artists[randomIndex];
  }

  async saveGameHistory(historyData: InsertGameHistory): Promise<GameHistory> {
    const id = this.currentGameHistoryId++;
    const history: GameHistory = { 
      id,
      userId: historyData.userId ?? null,
      targetArtistId: historyData.targetArtistId,
      attemptsUsed: historyData.attemptsUsed,
      isCorrect: historyData.isCorrect,
      score: historyData.score,
      timestamp: historyData.timestamp
    };
    this.gameHistoryList.push(history);
    return history;
  }

  async getGameHistoryByUserId(userId: number): Promise<GameHistory[]> {
    return this.gameHistoryList.filter(history => history.userId === userId);
  }
}

export const storage = new MemStorage();
