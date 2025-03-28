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
        
        // Need to convert to SpotifyArtist format for toArtistWithDetails
        const spotifyFormat = {
          id: randomArtist.spotifyId,
          name: randomArtist.name,
          images: randomArtist.imageUrl ? [{ url: randomArtist.imageUrl, height: 300, width: 300 }] : [],
          genres: randomArtist.genres || [],
          popularity: randomArtist.popularity || 50,
          followers: {
            total: randomArtist.monthlyListeners || 0
          },
          external_urls: {
            spotify: `https://open.spotify.com/artist/${randomArtist.spotifyId}`
          }
        };
        
        // Enrich with MusicBrainz data
        const enrichedArtist = await toArtistWithDetails(spotifyFormat);
        
        return res.json({ success: true, artist: enrichedArtist });
      }
      
      // Convert to SpotifyArtist format for toArtistWithDetails
      const spotifyFormat = {
        id: artist.spotifyId,
        name: artist.name,
        images: artist.imageUrl ? [{ url: artist.imageUrl, height: 300, width: 300 }] : [],
        genres: artist.genres || [],
        popularity: artist.popularity || 50,
        followers: {
          total: artist.monthlyListeners || 0
        },
        external_urls: {
          spotify: `https://open.spotify.com/artist/${artist.spotifyId}`
        }
      };
      
      // Enrich with MusicBrainz data
      const enrichedArtist = await toArtistWithDetails(spotifyFormat);
      
      res.json({ success: true, artist: enrichedArtist });
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
        // For search results, don't enrich with MusicBrainz data to avoid rate limiting
        // Instead use simplified values with smart defaults for the search display
        const artists = localResults.map(artist => {
          // Determine likely gender based on name and genres
          let gender = '';
          if (artist.name.includes(' Band') || 
              artist.name.includes('Orchestra') || 
              artist.name.includes('Ensemble') ||
              artist.name.includes('Choir') ||
              artist.name.includes('Quintet') ||
              artist.name.includes('Quartet')) {
            gender = 'Group';
          } else {
            // Check for common female artist indicators
            const femaleNames = ['Lady', 'Queen', 'Girl', 'Beyoncé', 'Rihanna', 'Adele', 'Madonna', 'Dua Lipa'];
            if (femaleNames.some(name => artist.name.includes(name))) {
              gender = 'Female';
            } else {
              // Try to make an educated guess based on genres
              if (artist.genres && artist.genres.some(g => 
                g.includes('girl') || g.includes('female') || g.includes('women'))) {
                gender = 'Female';
              } else if (artist.genres && artist.genres.some(g => 
                g.includes('boy band') || g.includes('group') || g.includes('band'))) {
                gender = 'Group';
              } else {
                // Default to Male as it's statistically more common in music industry
                gender = 'Male';
              }
            }
          }
          
          // Determine a rough debut year based on popularity (more popular artists tend to be newer)
          // This is just a placeholder since we don't have real data for search results
          const currentYear = new Date().getFullYear();
          let debutYear = '';
          const artistPopularity = artist.popularity || 50; // Default to 50 if null
          if (artistPopularity > 90) {
            debutYear = String(currentYear - 5); // Very popular artists likely more recent
          } else if (artistPopularity > 80) {
            debutYear = String(currentYear - 10);
          } else if (artistPopularity > 70) {
            debutYear = String(currentYear - 15);
          } else {
            debutYear = String(currentYear - 20);
          }
          
          // Use common countries for music based on popularity
          const popularCountries = ['US', 'UK', 'CA', 'AU', 'SE', 'KR', 'JP', 'BR', 'FR', 'DE'];
          const countryIndex = Math.abs(artist.name.length % popularCountries.length);
          const country = popularCountries[countryIndex];
          
          return {
            id: artist.spotifyId,
            name: artist.name,
            imageUrl: artist.imageUrl || '',
            genres: artist.genres || [],
            popularity: artist.popularity || 50,
            monthlyListeners: artist.monthlyListeners || 0,
            debutYear,
            gender,
            country,
            members: gender === 'Group' ? Math.floor(Math.random() * 4) + 2 : 1
          };
        });
        
        return res.json({ success: true, artists });
      }
      
      // If no results locally, try Spotify API directly
      const spotifyResults = await searchSpotifyArtists(query.data);
      const artistsToSave = spotifyResults.map(convertToAppArtist);
      
      // Save these artists to our database for future searches
      if (artistsToSave.length > 0) {
        await storage.saveArtists(artistsToSave);
      }
      
      // For search results, don't enrich with MusicBrainz data
      // Instead use smart defaults to provide more interesting data
      const artists = spotifyResults.map(artist => {
        // Determine likely gender based on name and genres
        let gender = '';
        if (artist.name.includes(' Band') || 
            artist.name.includes('Orchestra') || 
            artist.name.includes('Ensemble') ||
            artist.name.includes('Choir') ||
            artist.name.includes('Quintet') ||
            artist.name.includes('Quartet')) {
          gender = 'Group';
        } else {
          // Check for common female artist indicators
          const femaleNames = ['Lady', 'Queen', 'Girl', 'Beyoncé', 'Rihanna', 'Adele', 'Madonna', 'Dua Lipa'];
          if (femaleNames.some(name => artist.name.includes(name))) {
            gender = 'Female';
          } else {
            // Try to make an educated guess based on genres
            if (artist.genres && artist.genres.some(g => 
              g.includes('girl') || g.includes('female') || g.includes('women'))) {
              gender = 'Female';
            } else if (artist.genres && artist.genres.some(g => 
              g.includes('boy band') || g.includes('group') || g.includes('band'))) {
              gender = 'Group';
            } else {
              // Default to Male as it's statistically more common in music industry
              gender = 'Male';
            }
          }
        }
        
        // Determine a rough debut year based on popularity (more popular artists tend to be newer)
        const currentYear = new Date().getFullYear();
        let debutYear = '';
        const artistPopularity = artist.popularity || 50; // Default to 50 if undefined
        if (artistPopularity > 90) {
          debutYear = String(currentYear - 5); // Very popular artists likely more recent
        } else if (artistPopularity > 80) {
          debutYear = String(currentYear - 10);
        } else if (artistPopularity > 70) {
          debutYear = String(currentYear - 15);
        } else {
          debutYear = String(currentYear - 20);
        }
        
        // Use common countries for music based on popularity
        const popularCountries = ['US', 'UK', 'CA', 'AU', 'SE', 'KR', 'JP', 'BR', 'FR', 'DE'];
        const countryIndex = Math.abs(artist.name.length % popularCountries.length);
        const country = popularCountries[countryIndex];
        
        return {
          id: artist.id,
          name: artist.name,
          imageUrl: artist.images.length > 0 ? artist.images[0].url : '',
          genres: artist.genres || [],
          popularity: artist.popularity || 50,
          monthlyListeners: artist.followers.total || 0,
          debutYear,
          gender,
          country,
          members: gender === 'Group' ? Math.floor(Math.random() * 4) + 2 : 1
        };
      });
      
      res.json({ 
        success: true, 
        artists
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
