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

/**
 * Search for an artist in the MusicBrainz database
 * @param artistName The name of the artist to search for
 * @returns Promise with MusicBrainz artist data
 */
export async function searchMusicBrainzArtist(artistName: string): Promise<MusicBrainzArtistInfo | null> {
  try {
    // Build the query URL with proper encoding
    const url = `${MUSICBRAINZ_API_URL}/artist/?query=${encodeURIComponent(artistName)}&fmt=json`;
    
    // Make the request with a small delay to respect rate limits
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
      
      return info;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching from MusicBrainz API:', error);
    return null;
  }
}

/**
 * Get artist info by MusicBrainz ID (MBID)
 * This fetches more detailed information about a specific artist
 */
export async function getArtistByMbid(mbid: string): Promise<MusicBrainzArtistInfo | null> {
  try {
    // Wait for 1 second to respect rate limits (1 request per second is recommended)
    await new Promise(resolve => setTimeout(resolve, 1100));
    
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
    
    return info;
  } catch (error) {
    console.error('Error fetching artist by MBID:', error);
    return null;
  }
}

/**
 * Helper function that combines search and detailed lookup
 * First searches for the artist, then fetches detailed info if found
 */
export async function getEnrichedArtistInfo(artistName: string): Promise<MusicBrainzArtistInfo> {
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
    
    if (!searchResult) {
      return defaultInfo;
    }
    
    // If we have an MBID, get more detailed info
    if (searchResult.mbid) {
      const detailedInfo = await getArtistByMbid(searchResult.mbid);
      if (detailedInfo) {
        return detailedInfo;
      }
    }
    
    // Return the search result if we couldn't get detailed info
    return searchResult;
  } catch (error) {
    console.error('Error in getEnrichedArtistInfo:', error);
    return {
      type: undefined,
      gender: undefined,
      country: undefined,
      startYear: undefined
    };
  }
}