import { ArtistWithDetails } from "@shared/types";
import { apiRequest } from "./queryClient";

export async function searchArtists(query: string): Promise<ArtistWithDetails[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  try {
    const response = await apiRequest("GET", `/api/artists/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.success) {
      return data.artists.map((artist: any): ArtistWithDetails => ({
        id: artist.spotifyId,
        name: artist.name,
        imageUrl: artist.imageUrl || '',
        genres: artist.genres || [],
        popularity: artist.popularity || 0,
        monthlyListeners: artist.monthlyListeners || 0
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Error searching artists:", error);
    return [];
  }
}
