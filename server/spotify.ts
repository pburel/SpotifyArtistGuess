import { ArtistWithDetails, SpotifyArtist } from "@shared/types";
import { InsertArtist } from "@shared/schema";

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
    
    return accessToken;
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
  // Get several popular playlists to extract artists from
  const playlistIds = [
    '37i9dQZEVXbMDoHDwVN2tF', // Global Top 50
    '37i9dQZF1DXcBWIGoYBM5M', // Today's Top Hits
    '37i9dQZF1DX0XUsuxWHRQd', // RapCaviar
    '37i9dQZF1DX4dyzvuaRJ0n', // mint
    '37i9dQZF1DX10zKzsJ2jva', // Viva Latino
  ];
  
  const uniqueArtists = new Map<string, SpotifyArtist>();
  
  for (const playlistId of playlistIds) {
    try {
      const playlistData = await spotifyApiRequest(`/playlists/${playlistId}`);
      
      for (const item of playlistData.tracks.items) {
        if (item.track && item.track.artists) {
          for (const artist of item.track.artists) {
            if (!uniqueArtists.has(artist.id)) {
              // Fetch full artist details
              const artistDetails = await spotifyApiRequest(`/artists/${artist.id}`);
              uniqueArtists.set(artist.id, artistDetails);
              
              // If we have enough artists, return early
              if (uniqueArtists.size >= limit) {
                return Array.from(uniqueArtists.values());
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching playlist ${playlistId}:`, error);
    }
  }
  
  return Array.from(uniqueArtists.values());
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
  
  const data = await spotifyApiRequest('/search', {
    q: query,
    type: 'artist',
    limit: limit.toString()
  });
  
  return data.artists.items;
}

/**
 * Convert Spotify artist to ArtistWithDetails type for the frontend
 */
export function toArtistWithDetails(artist: SpotifyArtist): ArtistWithDetails {
  return {
    id: artist.id,
    name: artist.name,
    imageUrl: artist.images.length > 0 ? artist.images[0].url : '',
    genres: artist.genres,
    popularity: artist.popularity,
    monthlyListeners: Math.floor(artist.popularity * 1000000 / 100)
  };
}
