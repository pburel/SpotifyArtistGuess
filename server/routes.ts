import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchTopArtists, convertToAppArtist, searchSpotifyArtists, toArtistWithDetails } from "./spotify";
import { z } from "zod";
import { insertGameHistorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize with top artists if database is empty
  app.get("/api/initialize", async (req: Request, res: Response) => {
    try {
      const existingArtists = await storage.getAllArtists();
      
      if (existingArtists.length === 0) {
        const spotifyArtists = await fetchTopArtists(1000);
        const artistsToSave = spotifyArtists.map(convertToAppArtist);
        await storage.saveArtists(artistsToSave);
        res.json({ success: true, count: artistsToSave.length });
      } else {
        res.json({ success: true, message: "Artists already loaded", count: existingArtists.length });
      }
    } catch (error: any) {
      console.error("Error initializing artists:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get random artist for the game
  app.get("/api/game/random-artist", async (req: Request, res: Response) => {
    try {
      const artist = await storage.getRandomArtist();
      
      if (!artist) {
        // If no artists in database, try to initialize
        const spotifyArtists = await fetchTopArtists(100);
        const artistsToSave = spotifyArtists.map(convertToAppArtist);
        await storage.saveArtists(artistsToSave);
        
        // Get a random artist from the newly saved ones
        const randomArtist = await storage.getRandomArtist();
        
        if (!randomArtist) {
          return res.status(404).json({ success: false, message: "No artists found" });
        }
        
        return res.json({ success: true, artist: randomArtist });
      }
      
      res.json({ success: true, artist });
    } catch (error: any) {
      console.error("Error getting random artist:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Search for artists
  app.get("/api/artists/search", async (req: Request, res: Response) => {
    try {
      const query = z.string().min(1).safeParse(req.query.q);
      
      if (!query.success) {
        return res.status(400).json({ success: false, error: "Invalid search query" });
      }
      
      // Try searching local database first
      const localResults = await storage.searchArtistsByName(query.data);
      
      if (localResults.length > 0) {
        return res.json({ success: true, artists: localResults });
      }
      
      // If no results locally, try Spotify API directly
      const spotifyResults = await searchSpotifyArtists(query.data);
      const artistsToSave = spotifyResults.map(convertToAppArtist);
      
      // Save these artists to our database for future searches
      if (artistsToSave.length > 0) {
        await storage.saveArtists(artistsToSave);
      }
      
      res.json({ 
        success: true, 
        artists: spotifyResults.map(artist => ({
          spotifyId: artist.id,
          name: artist.name,
          imageUrl: artist.images.length > 0 ? artist.images[0].url : undefined,
          genres: artist.genres,
          popularity: artist.popularity,
          monthlyListeners: Math.floor(artist.popularity * 1000000 / 100)
        }))
      });
    } catch (error: any) {
      console.error("Error searching artists:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Submit game result
  app.post("/api/game/result", async (req: Request, res: Response) => {
    try {
      const result = insertGameHistorySchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ success: false, error: "Invalid game result data" });
      }
      
      const savedResult = await storage.saveGameHistory(result.data);
      res.json({ success: true, result: savedResult });
    } catch (error: any) {
      console.error("Error saving game result:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
