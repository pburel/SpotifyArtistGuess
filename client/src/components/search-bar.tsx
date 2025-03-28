import { useState, useEffect, useRef } from "react";
import { ArtistWithDetails } from "@shared/types";
import { searchArtists } from "@/lib/spotify";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onGuess: (artist: ArtistWithDetails) => void;
  disabled?: boolean;
}

export default function SearchBar({ onGuess, disabled = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtistWithDetails[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithDetails | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle search query changes
  useEffect(() => {
    const handleSearch = async () => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const artists = await searchArtists(query);
        setResults(artists);
      } catch (error) {
        console.error("Error searching artists:", error);
      } finally {
        setIsSearching(false);
      }
    };
    
    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle clicks outside the search box to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle artist selection
  const handleSelectArtist = (artist: ArtistWithDetails) => {
    setSelectedArtist(artist);
    setQuery(artist.name);
    setShowResults(false);
    
    // Automatically submit the guess when an artist is selected
    onGuess(artist);
    setQuery("");
    setSelectedArtist(null);
  };

  // Submit the guess
  const handleSubmitGuess = () => {
    if (selectedArtist) {
      onGuess(selectedArtist);
      setQuery("");
      setSelectedArtist(null);
    } else if (results.length > 0) {
      // If no artist selected but we have results, use the first one
      onGuess(results[0]);
      setQuery("");
    }
  };

  return (
    <div className="max-w-md mx-auto mb-8 relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type an artist name..."
          className="w-full py-3 px-12 rounded-full bg-white bg-opacity-10 focus:bg-opacity-20 border border-transparent focus:outline-none focus:border-[#1DB954] text-white placeholder-gray-400 transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          disabled={disabled}
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Button
          onClick={handleSubmitGuess}
          disabled={disabled || (!selectedArtist && results.length === 0)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#1DB954] hover:bg-opacity-80 text-black font-semibold rounded-full px-4 py-1.5 text-sm transition-all"
        >
          Guess
        </Button>
      </div>

      {/* Search Results */}
      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute z-10 w-full mt-1 bg-[#191414] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isSearching ? (
            <div className="px-4 py-3 text-center text-gray-400">Searching...</div>
          ) : results.length > 0 ? (
            results.map((artist) => (
              <div 
                key={artist.id}
                className="px-4 py-2 hover:bg-gray-800 cursor-pointer flex items-center"
                onClick={() => handleSelectArtist(artist)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 mr-3 overflow-hidden">
                  {artist.imageUrl ? (
                    <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      <span className="text-xs">{artist.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <span>{artist.name}</span>
              </div>
            ))
          ) : query.length > 0 ? (
            <div className="px-4 py-3 text-center text-gray-400">No artists found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
