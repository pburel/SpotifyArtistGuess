import axios from 'axios';

// Set a user agent with contact information as requested by MusicBrainz API guidelines
const USER_AGENT = 'Spotle-Game/1.0.0 (https://replit.com/~)';

// MusicBrainz API base URL
const MUSICBRAINZ_API_URL = 'https://musicbrainz.org/ws/2';

// Interface for the data we want to retrieve from MusicBrainz
export interface MusicBrainzArtistInfo {
  startYear?: string;
  type?: string; // Group, Person, etc.
  gender?: string;
  country?: string;
  mbid?: string; // MusicBrainz ID
}

// Simple in-memory cache for MusicBrainz data
const mbCache = new Map<string, MusicBrainzArtistInfo | null>();

// Rate limiting management
const REQUEST_DELAY = 1100; // At least 1.1 seconds between requests (Music Brainz recommends 1 request per second)
let lastRequestTime = 0;

// Helper function to wait between requests according to rate limit
async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY && lastRequestTime !== 0) {
    const waitTime = REQUEST_DELAY - timeSinceLastRequest;
    console.log(`Rate limiting MusicBrainz API. Waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Search for an artist in the MusicBrainz database
 * @param artistName The name of the artist to search for
 * @returns Promise with MusicBrainz artist data
 */
export async function searchMusicBrainzArtist(artistName: string): Promise<MusicBrainzArtistInfo | null> {
  // First check if we have this artist in cache
  const cacheKey = `search:${artistName.toLowerCase()}`;
  if (mbCache.has(cacheKey)) {
    console.log(`Using cached data for artist search: ${artistName}`);
    return mbCache.get(cacheKey) || null;
  }
  
  try {
    // Apply rate limiting
    await waitForRateLimit();
    
    // Build the query URL with proper encoding
    const url = `${MUSICBRAINZ_API_URL}/artist/?query=${encodeURIComponent(artistName)}&fmt=json`;
    
    // Make the request with proper headers
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
    
    // Check if we have results
    if (response.data && response.data.artists && response.data.artists.length > 0) {
      // Get the most relevant result (first one)
      const artist = response.data.artists[0];
      
      // Extract the data we need
      const info: MusicBrainzArtistInfo = {
        mbid: artist.id,
        type: artist.type, // 'Group' or 'Person'
        gender: artist.gender,
        country: artist.country
      };
      
      // Extract start year if life-span data is available
      if (artist['life-span'] && artist['life-span'].begin) {
        // Usually just need the year part
        info.startYear = artist['life-span'].begin.split('-')[0];
      }
      
      // Cache the result
      mbCache.set(cacheKey, info);
      
      return info;
    }
    
    // Cache negative result too to avoid repeated lookups
    mbCache.set(cacheKey, null);
    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 503) {
      console.warn('MusicBrainz API rate limit exceeded. Using default values.');
    } else {
      console.error('Error fetching from MusicBrainz API:', error);
    }
    return null;
  }
}

/**
 * Get artist info by MusicBrainz ID (MBID)
 * This fetches more detailed information about a specific artist
 */
export async function getArtistByMbid(mbid: string): Promise<MusicBrainzArtistInfo | null> {
  // First check if we have this MBID in cache
  const cacheKey = `mbid:${mbid}`;
  if (mbCache.has(cacheKey)) {
    console.log(`Using cached data for MBID: ${mbid}`);
    return mbCache.get(cacheKey) || null;
  }
  
  try {
    // Apply rate limiting
    await waitForRateLimit();
    
    const url = `${MUSICBRAINZ_API_URL}/artist/${mbid}?fmt=json`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
    
    const artist = response.data;
    
    const info: MusicBrainzArtistInfo = {
      mbid: artist.id,
      type: artist.type,
      gender: artist.gender,
      country: artist.country
    };
    
    if (artist['life-span'] && artist['life-span'].begin) {
      info.startYear = artist['life-span'].begin.split('-')[0];
    }
    
    // Cache the result
    mbCache.set(cacheKey, info);
    
    return info;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 503) {
      console.warn('MusicBrainz API rate limit exceeded. Using default values.');
    } else {
      console.error('Error fetching artist by MBID:', error);
    }
    
    // Cache negative result to avoid repeated lookups
    mbCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Helper function that combines search and detailed lookup
 * First searches for the artist, then fetches detailed info if found
 */
export async function getEnrichedArtistInfo(artistName: string): Promise<MusicBrainzArtistInfo> {
  // First check if we have cached enriched data
  const cacheKey = `enriched:${artistName.toLowerCase()}`;
  if (mbCache.has(cacheKey)) {
    console.log(`Using cached enriched data for: ${artistName}`);
    // We know this will always be a MusicBrainzArtistInfo object, not null
    return mbCache.get(cacheKey) as MusicBrainzArtistInfo;
  }
  
  try {
    // Default values if MusicBrainz data is not available
    const defaultInfo: MusicBrainzArtistInfo = {
      type: undefined,
      gender: undefined,
      country: undefined,
      startYear: undefined
    };
    
    // First search for the artist
    const searchResult = await searchMusicBrainzArtist(artistName);
    
    let result: MusicBrainzArtistInfo;
    
    if (!searchResult) {
      result = defaultInfo;
    } 
    else if (searchResult.mbid) {
      // If we have an MBID, get more detailed info
      const detailedInfo = await getArtistByMbid(searchResult.mbid);
      result = detailedInfo || searchResult;
    } 
    else {
      // Return the search result if no MBID
      result = searchResult;
    }
    
    // Cache the result
    mbCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error in getEnrichedArtistInfo:', error);
    const defaultInfo: MusicBrainzArtistInfo = {
      type: undefined,
      gender: undefined,
      country: undefined,
      startYear: undefined
    };
    
    // Cache the default info to avoid repeated failures
    mbCache.set(cacheKey, defaultInfo);
    return defaultInfo;
  }
}