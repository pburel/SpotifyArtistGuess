import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { spotifyAuth, spotifyCallback } from "./auth";
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
          // First check well-known artists with accurate gender information
          const artistGenderMap: Record<string, string> = {
            // Female artists
            'Taylor Swift': 'Female',
            'Beyoncé': 'Female',
            'Madonna': 'Female',
            'Lady Gaga': 'Female',
            'Adele': 'Female',
            'Rihanna': 'Female',
            'Ariana Grande': 'Female',
            'Katy Perry': 'Female',
            'Whitney Houston': 'Female',
            'Billie Eilish': 'Female',
            'Dua Lipa': 'Female',
            'Celine Dion': 'Female',
            'Shakira': 'Female',
            'Mariah Carey': 'Female',
            'Amy Winehouse': 'Female',
            'Ella Fitzgerald': 'Female',
            'Björk': 'Female',
            
            // Male artists
            'Bruce Springsteen': 'Male',
            'Jay-Z': 'Male',
            'Kanye West': 'Male',
            'Drake': 'Male',
            'The Weeknd': 'Male',
            'Michael Jackson': 'Male',
            'Elton John': 'Male',
            'Bruno Mars': 'Male',
            'Justin Bieber': 'Male',
            'Ed Sheeran': 'Male',
            'Elvis Presley': 'Male',
            'Frank Sinatra': 'Male',
            'David Bowie': 'Male',
            'Bob Dylan': 'Male',
            'Bob Marley': 'Male',
            'John Lennon': 'Male',
            'Paul McCartney': 'Male',
            
            // Groups
            'The Beatles': 'Group',
            'Queen': 'Group',
            'The Rolling Stones': 'Group',
            'Led Zeppelin': 'Group',
            'Pink Floyd': 'Group',
            'Coldplay': 'Group',
            'BTS': 'Group',
            'BLACKPINK': 'Group',
            'TWICE': 'Group',
            'Fleetwood Mac': 'Group',
            'The Killers': 'Group',
            'Linkin Park': 'Group',
            'Metallica': 'Group',
            'AC/DC': 'Group',
            'ABBA': 'Group',
            'Nirvana': 'Group',
            'Green Day': 'Group',
            'Backstreet Boys': 'Group',
            'Destiny\'s Child': 'Group',
            'One Direction': 'Group',
            'The Supremes': 'Group'
          };
          
          // Try to find the artist in our map first
          let gender = '';
          const genderExactMatch = artistGenderMap[artist.name];
          if (genderExactMatch) {
            gender = genderExactMatch;
          } else {
            // If no exact match, check if the name contains specific band/group indicators
            if (artist.name.includes(' Band') || 
                artist.name.includes('Orchestra') || 
                artist.name.includes('Ensemble') ||
                artist.name.includes('Choir') ||
                artist.name.includes('Quintet') ||
                artist.name.includes('Quartet') ||
                artist.name.includes(' and the ') ||
                artist.name.includes(' & The ')) {
              gender = 'Group';
            } else {
              // Check for partial matches in our map
              const partialMatch = Object.keys(artistGenderMap).find(name => 
                artist.name.includes(name) || name.includes(artist.name)
              );
              
              if (partialMatch) {
                gender = artistGenderMap[partialMatch];
              } else {
                // Still no match, try to make an educated guess based on genres
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
          
          // First check for well-known artists with known countries
          const artistCountryMap: Record<string, string> = {
            // US artists
            'Bruce Springsteen': 'US',
            'Taylor Swift': 'US',
            'Beyoncé': 'US',
            'Jay-Z': 'US',
            'Kanye West': 'US',
            'Lady Gaga': 'US',
            'Whitney Houston': 'US',
            'Madonna': 'US',
            'Michael Jackson': 'US',
            'Elvis Presley': 'US',
            'Ariana Grande': 'US',
            'Bruno Mars': 'US',
            'Katy Perry': 'US',
            'Billie Eilish': 'US',
            'Post Malone': 'US',
            'Frank Sinatra': 'US',
            'Bob Dylan': 'US',
            'Ella Fitzgerald': 'US',
            
            // UK artists
            'The Beatles': 'UK',
            'Adele': 'UK',
            'Ed Sheeran': 'UK',
            'Elton John': 'UK',
            'Queen': 'UK',
            'The Rolling Stones': 'UK',
            'David Bowie': 'UK',
            'Led Zeppelin': 'UK',
            'Pink Floyd': 'UK',
            'Coldplay': 'UK',
            'Amy Winehouse': 'UK',
            'Dua Lipa': 'UK',
            
            // Canadian artists
            'Drake': 'CA',
            'Justin Bieber': 'CA',
            'The Weeknd': 'CA',
            'Celine Dion': 'CA',
            'Shawn Mendes': 'CA',
            'Avril Lavigne': 'CA',
            
            // Korean artists
            'BTS': 'KR',
            'BLACKPINK': 'KR',
            'TWICE': 'KR',
            'Psy': 'KR',
            
            // Other countries
            'ABBA': 'SE',
            'Shakira': 'CO',
            'Rihanna': 'BB',
            'Bob Marley': 'JM',
            'AC/DC': 'AU',
            'Björk': 'IS'
          };
          
          // Try to find the artist in our map first
          let country = '';
          const countryExactMatch = artistCountryMap[artist.name];
          if (countryExactMatch) {
            country = countryExactMatch;
          } else {
            // If no exact match, check for partial matches
            const partialMatch = Object.keys(artistCountryMap).find(name => 
              artist.name.includes(name) || name.includes(artist.name)
            );
            
            if (partialMatch) {
              country = artistCountryMap[partialMatch];
            } else {
              // Use a weighted distribution based on music industry
              // US accounts for the largest share of popular music, followed by UK
              const countryDistribution = [
                'US', 'US', 'US', 'US', 'US', // 5/15 chance for US
                'UK', 'UK', 'UK',             // 3/15 chance for UK  
                'CA', 'CA',                   // 2/15 chance for Canada
                'AU',                         // 1/15 for each of these
                'SE', 
                'KR', 
                'JP',
                'BR'
              ];
              
              // Use a consistent selection based on artist name length
              // For a more uniform distribution than just modulo
              const hash = artist.name.split('').reduce((acc, char) => 
                acc + char.charCodeAt(0), 0);
              
              country = countryDistribution[hash % countryDistribution.length];
            }
          }
          
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
        // According to MusicBrainz standards, gender is only for persons, not groups
        let gender = '';
        
        // First, determine if this is a group/band
        const isGroup = 
          artist.name.includes(' Band') || 
          artist.name.includes('Orchestra') || 
          artist.name.includes('Ensemble') ||
          artist.name.includes('Choir') ||
          artist.name.includes('Quintet') ||
          artist.name.includes('Quartet') ||
          artist.name.includes(' and the ') ||
          artist.name.includes(' & The ') ||
          artist.name.includes('The ') ||
          artist.name.includes(' Trio') ||
          (artist.genres && artist.genres.some(g => 
            g.includes('boy band') || 
            g.includes('group') || 
            g.includes('band')
          ));
          
        // Well-known groups
        const knownGroups = [
          'The Beatles', 'Queen', 'The Rolling Stones', 'Led Zeppelin', 
          'Pink Floyd', 'Coldplay', 'BTS', 'BLACKPINK', 'TWICE', 'Fleetwood Mac', 
          'The Killers', 'Linkin Park', 'Metallica', 'AC/DC', 'ABBA', 'Nirvana', 
          'Green Day', 'Backstreet Boys', 'Destiny\'s Child', 'One Direction', 
          'The Supremes', 'Imagine Dragons', 'Guns N\' Roses', 'Red Hot Chili Peppers'
        ];
          
        if (isGroup || knownGroups.some(group => artist.name.includes(group))) {
          gender = 'Group';
        } else {
          // If not a group, determine gender
          // Well-known female artists
          const femaleArtists = [
            'Taylor Swift', 'Beyoncé', 'Madonna', 'Lady Gaga', 'Adele', 
            'Rihanna', 'Ariana Grande', 'Katy Perry', 'Whitney Houston', 
            'Billie Eilish', 'Dua Lipa', 'Celine Dion', 'Shakira', 
            'Mariah Carey', 'Amy Winehouse', 'Ella Fitzgerald', 'Björk',
            'SZA', 'Lana Del Rey', 'Selena Gomez', 'Miley Cyrus', 'P!nk',
            'Nicki Minaj', 'Alicia Keys', 'Christina Aguilera', 'Lizzo',
            'Olivia Rodrigo', 'Kelly Clarkson'
          ];
          
          // Well-known male artists  
          const maleArtists = [
            'Bruce Springsteen', 'Jay-Z', 'Kanye West', 'Drake', 
            'The Weeknd', 'Michael Jackson', 'Elton John', 'Bruno Mars', 
            'Justin Bieber', 'Ed Sheeran', 'Elvis Presley', 'Frank Sinatra', 
            'David Bowie', 'Bob Dylan', 'Bob Marley', 'John Lennon', 
            'Paul McCartney', 'Harry Styles', 'Bad Bunny', 'Post Malone',
            'Travis Scott', 'Eminem', 'Kendrick Lamar', 'John Mayer',
            'Justin Timberlake', 'Stevie Wonder', 'Shawn Mendes'
          ];
          
          // Check for exact matches in our lists
          if (femaleArtists.includes(artist.name)) {
            gender = 'Female';
          } else if (maleArtists.includes(artist.name)) {
            gender = 'Male';
          } else {
            // Check for partial matches
            const femaleMatch = femaleArtists.some(name => 
              artist.name.includes(name) || name.includes(artist.name)
            );
            
            const maleMatch = maleArtists.some(name => 
              artist.name.includes(name) || name.includes(artist.name)
            );
            
            if (femaleMatch) {
              gender = 'Female';
            } else if (maleMatch) {
              gender = 'Male';
            } else {
              // Look for female indicators in name
              const femaleIndicators = [
                'Lady', 'Queen', 'Girl', 'Woman', 'Diva', 'Madam', 'Miss', 'Mrs', 'Ms'
              ];
              
              if (femaleIndicators.some(indicator => artist.name.includes(indicator))) {
                gender = 'Female';
              } else if (artist.genres && artist.genres.some(g => 
                g.includes('girl') || g.includes('female') || g.includes('women'))) {
                gender = 'Female';
              } else {
                // Default to Male as it's statistically more common in music industry
                gender = 'Male';
              }
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
        
        // First check for well-known artists with known countries
        const artistCountryMap: Record<string, string> = {
          // US artists
          'Bruce Springsteen': 'US',
          'Taylor Swift': 'US',
          'Beyoncé': 'US',
          'Jay-Z': 'US',
          'Kanye West': 'US',
          'Lady Gaga': 'US',
          'Whitney Houston': 'US',
          'Madonna': 'US',
          'Michael Jackson': 'US',
          'Elvis Presley': 'US',
          'Ariana Grande': 'US',
          'Bruno Mars': 'US',
          'Katy Perry': 'US',
          'Billie Eilish': 'US',
          'Post Malone': 'US',
          'Frank Sinatra': 'US',
          'Bob Dylan': 'US',
          'Ella Fitzgerald': 'US',
          
          // UK artists
          'The Beatles': 'UK',
          'Adele': 'UK',
          'Ed Sheeran': 'UK',
          'Elton John': 'UK',
          'Queen': 'UK',
          'The Rolling Stones': 'UK',
          'David Bowie': 'UK',
          'Led Zeppelin': 'UK',
          'Pink Floyd': 'UK',
          'Coldplay': 'UK',
          'Amy Winehouse': 'UK',
          'Dua Lipa': 'UK',
          
          // Canadian artists
          'Drake': 'CA',
          'Justin Bieber': 'CA',
          'The Weeknd': 'CA',
          'Celine Dion': 'CA',
          'Shawn Mendes': 'CA',
          'Avril Lavigne': 'CA',
          
          // Korean artists
          'BTS': 'KR',
          'BLACKPINK': 'KR',
          'TWICE': 'KR',
          'Psy': 'KR',
          
          // Other countries
          'ABBA': 'SE',
          'Shakira': 'CO',
          'Rihanna': 'BB',
          'Bob Marley': 'JM',
          'AC/DC': 'AU',
          'Björk': 'IS'
        };
        
        // Try to find the artist in our map first
        let country = '';
        const countryExactMatch = artistCountryMap[artist.name];
        if (countryExactMatch) {
          country = countryExactMatch;
        } else {
          // If no exact match, check for partial matches
          const partialMatch = Object.keys(artistCountryMap).find(name => 
            artist.name.includes(name) || name.includes(artist.name)
          );
          
          if (partialMatch) {
            country = artistCountryMap[partialMatch];
          } else {
            // Use a weighted distribution based on music industry
            // US accounts for the largest share of popular music, followed by UK
            const countryDistribution = [
              'US', 'US', 'US', 'US', 'US', // 5/15 chance for US
              'UK', 'UK', 'UK',             // 3/15 chance for UK  
              'CA', 'CA',                   // 2/15 chance for Canada
              'AU',                         // 1/15 for each of these
              'SE', 
              'KR', 
              'JP',
              'BR'
            ];
            
            // Use a consistent selection based on artist name length
            // For a more uniform distribution than just modulo
            const hash = artist.name.split('').reduce((acc, char) => 
              acc + char.charCodeAt(0), 0);
            
            country = countryDistribution[hash % countryDistribution.length];
          }
        }
        
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

  // Spotify auth routes
  app.get('/api/auth/spotify', spotifyAuth);
  app.get('/api/auth/callback', spotifyCallback);

  const httpServer = createServer(app);
  return httpServer;
}
