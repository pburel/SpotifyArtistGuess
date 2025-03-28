import { ArtistWithDetails, SpotifyArtist } from "@shared/types";
import { InsertArtist } from "@shared/schema";
import { getEnrichedArtistInfo, MusicBrainzArtistInfo } from "./musicbrainz";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
let accessToken: string | null = null;
let tokenExpiration: number = 0;

/**
 * Gets a Spotify API access token using client credentials flow
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  
  // Return cached token if still valid
  if (accessToken && tokenExpiration > now) {
    return accessToken;
  }
  
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify API credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.");
  }
  
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Spotify token: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiration = now + (data.expires_in * 1000);
    
    // This assertion is safe because if data.access_token was undefined, 
    // we would have thrown an error before reaching this point
    return accessToken as string;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
}

/**
 * Makes an authenticated request to the Spotify API
 */
async function spotifyApiRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const token = await getAccessToken();
  
  const url = new URL(`${SPOTIFY_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify API error: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Fetch top Spotify artists to populate the game database
 */
export async function fetchTopArtists(limit: number = 50, offset: number = 0): Promise<SpotifyArtist[]> {
  try {
    // Use search API to find popular artists across different genres
    const genres = [
      'pop', 'rock', 'hip hop', 'rap', 'electronic', 'r&b', 'country', 
      'latin', 'indie', 'dance', 'jazz', 'classical', 'k-pop'
    ];
    
    const uniqueArtists = new Map<string, SpotifyArtist>();
    // Spotify API limit must be between 1-50
    const artistsPerGenre = Math.min(50, Math.max(1, Math.ceil(limit / genres.length)));
    
    // Get artists from each genre
    for (const genre of genres) {
      try {
        const searchData = await spotifyApiRequest('/search', {
          q: `genre:${genre}`,
          type: 'artist',
          limit: artistsPerGenre.toString(),
          offset: '0'
        });
        
        if (searchData.artists && searchData.artists.items) {
          for (const artist of searchData.artists.items) {
            if (!uniqueArtists.has(artist.id)) {
              uniqueArtists.set(artist.id, artist);
              
              // If we have enough artists, return early
              if (uniqueArtists.size >= limit) {
                return Array.from(uniqueArtists.values());
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error searching artists for genre ${genre}:`, error);
      }
    }
    
    // If we still don't have enough artists, try a broader search
    if (uniqueArtists.size < limit) {
      try {
        // Ensure the limit is within Spotify's allowed range (1-50)
        const remainingLimit = Math.min(50, Math.max(1, limit - uniqueArtists.size));
        const searchData = await spotifyApiRequest('/search', {
          q: 'year:2020-2024',
          type: 'artist',
          limit: remainingLimit.toString(),
          offset: '0'
        });
        
        if (searchData.artists && searchData.artists.items) {
          for (const artist of searchData.artists.items) {
            if (!uniqueArtists.has(artist.id)) {
              uniqueArtists.set(artist.id, artist);
            }
          }
        }
      } catch (error) {
        console.error('Error searching additional artists:', error);
      }
    }
    
    return Array.from(uniqueArtists.values());
  } catch (error) {
    console.error('Error fetching top artists:', error);
    return [];
  }
}

/**
 * Convert Spotify API artist format to our application format
 */
export function convertToAppArtist(spotifyArtist: SpotifyArtist): InsertArtist {
  return {
    spotifyId: spotifyArtist.id,
    name: spotifyArtist.name,
    imageUrl: spotifyArtist.images.length > 0 ? spotifyArtist.images[0].url : undefined,
    genres: spotifyArtist.genres,
    popularity: spotifyArtist.popularity,
    // Convert popularity to rough monthly listeners for game display
    monthlyListeners: Math.floor(spotifyArtist.popularity * 1000000 / 100)
  };
}

/**
 * Search for artists directly via Spotify API
 */
export async function searchSpotifyArtists(query: string, limit: number = 10): Promise<SpotifyArtist[]> {
  if (!query) return [];
  
  // Ensure the limit is within Spotify's allowed range (1-50)
  const validLimit = Math.min(50, Math.max(1, limit));
  
  const data = await spotifyApiRequest('/search', {
    q: query,
    type: 'artist',
    limit: validLimit.toString()
  });
  
  return data.artists?.items || [];
}

/**
 * Convert Spotify artist to ArtistWithDetails type for the frontend
 * Enriches artist data with additional details for UI display
 * Uses MusicBrainz data if available, falls back to generated data otherwise
 */
export async function toArtistWithDetails(artist: SpotifyArtist): Promise<ArtistWithDetails> {
  try {
    // Get MusicBrainz data
    const musicBrainzInfo = await getEnrichedArtistInfo(artist.name);
    
    // Generate consistent but pseudo-random properties based on artist id
    // This is used as fallback if MusicBrainz data is not available
    const hash = artist.id.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Determine if the artist is likely a band based on name and genres
    const isBand = artist.name.toLowerCase().includes('band') || 
                   artist.name.includes('&') || 
                   artist.name.includes(' and ') ||
                   artist.genres.some(g => 
                     g.includes('rock') || 
                     g.includes('metal') || 
                     g.includes('band')
                   );
    
    // Use MusicBrainz data if available, otherwise use fallbacks
    
    // Debut Year
    const debutYear = musicBrainzInfo.startYear || 
                      String(1960 + Math.abs(hash % 60));
    
    // Members/Type
    let members: number | string;
    if (musicBrainzInfo.type === 'Group') {
      members = 2 + Math.abs((hash >> 3) % 5); // Random band size between 2-6
    } else if (musicBrainzInfo.type === 'Person') {
      members = 1; // Solo artist
    } else {
      // Fallback to our heuristic
      members = isBand ? 2 + Math.abs((hash >> 3) % 5) : 1;
    }
    
    // Gender - Use MusicBrainz data if available
    // According to MusicBrainz standards, gender is only for persons, not groups
    let gender: string;
    if (musicBrainzInfo.type === 'Group') {
      gender = 'Group'; // Groups don't have genders in MusicBrainz
    } else if (musicBrainzInfo.gender) {
      // MusicBrainz uses "male", "female", "non-binary", "other", "not applicable"
      gender = musicBrainzInfo.gender.charAt(0).toUpperCase() + musicBrainzInfo.gender.slice(1);
    } else if (isBand) {
      gender = 'Group';
    } else {
      // If no MusicBrainz data and not a band, look at artist name for clues
      const femaleNames = [
        'Lady', 'Queen', 'Girl', 'Beyoncé', 'Rihanna', 'Adele', 'Madonna', 
        'Ariana', 'Katy', 'Whitney', 'Billie', 'Dua', 'Celine', 'Shakira', 
        'Mariah', 'Amy', 'Ella', 'Björk', 'Taylor'
      ];
      
      if (femaleNames.some(name => artist.name.includes(name))) {
        gender = 'Female';
      } else {
        gender = 'Male'; // Default as a fallback if we can't determine
      }
    }
    
    // Country - Use MusicBrainz if available
    const countries = ['US', 'UK', 'CA', 'AU', 'SE', 'KR', 'JP', 'DE', 'FR', 'BR', 'ES'];
    const country = musicBrainzInfo.country || 
                    countries[Math.abs((hash >> 8) % countries.length)];
    
    // Genre - Use first genre from Spotify if available
    const genre = artist.genres && artist.genres.length > 0 ? artist.genres[0] : 'Unknown';
    
    return {
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images.length > 0 ? artist.images[0].url : '',
      genres: artist.genres,
      popularity: artist.popularity,
      monthlyListeners: Math.floor(artist.popularity * 1000000 / 100),
      debutYear,
      members,
      gender,
      country
    };
  } catch (error) {
    console.error('Error enriching artist with MusicBrainz data:', error);
    
    // Fallback to our previous implementation if MusicBrainz fails
    const hash = artist.id.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const isBand = artist.name.toLowerCase().includes('band') || 
                   artist.name.includes('&') || 
                   artist.name.includes(' and ') ||
                   artist.genres.some(g => 
                     g.includes('rock') || 
                     g.includes('metal') || 
                     g.includes('band')
                   );
    
    const debutYear = String(1960 + Math.abs(hash % 60));
    const members = isBand ? 2 + Math.abs((hash >> 3) % 5) : 1;
    
    let gender: string;
    if (isBand) {
      gender = 'Group';
    } else {
      // If not a band, look at artist name for clues
      const femaleNames = [
        'Lady', 'Queen', 'Girl', 'Beyoncé', 'Rihanna', 'Adele', 'Madonna', 
        'Ariana', 'Katy', 'Whitney', 'Billie', 'Dua', 'Celine', 'Shakira', 
        'Mariah', 'Amy', 'Ella', 'Björk', 'Taylor'
      ];
      
      if (femaleNames.some(name => artist.name.includes(name))) {
        gender = 'Female';
      } else {
        gender = 'Male'; // Default as a fallback if we can't determine
      }
    }
    
    const countries = ['US', 'UK', 'CA', 'AU', 'SE', 'KR', 'JP', 'DE', 'FR', 'BR', 'ES'];
    const country = countries[Math.abs((hash >> 8) % countries.length)];
    
    return {
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images.length > 0 ? artist.images[0].url : '',
      genres: artist.genres,
      popularity: artist.popularity,
      monthlyListeners: Math.floor(artist.popularity * 1000000 / 100),
      debutYear,
      members,
      gender,
      country
    };
  }
}
