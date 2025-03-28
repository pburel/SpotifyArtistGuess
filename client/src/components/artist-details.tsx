import React from 'react';
import { ArtistWithDetails } from '@shared/types';
import { Badge } from './ui/badge';

// Function to get a placeholder value when data is missing
function getPlaceholder(value: any, placeholder: string = 'Unknown'): string {
  return value ? String(value) : placeholder;
}

// Map country codes to flag emojis
const countryFlags: Record<string, string> = {
  'US': '🇺🇸',
  'UK': '🇬🇧',
  'CA': '🇨🇦',
  'AU': '🇦🇺',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'SE': '🇸🇪',
  'KR': '🇰🇷',
  'JP': '🇯🇵',
  'BR': '🇧🇷',
  'ES': '🇪🇸',
  'IT': '🇮🇹',
};

interface ArtistDetailsProps {
  artist: ArtistWithDetails;
  isGuess?: boolean;
}

export default function ArtistDetails({ artist, isGuess = false }: ArtistDetailsProps) {
  // Set default values for missing data
  const debut = artist.debutYear || '—';
  const members = artist.members ? artist.members.toString() : 'Solo';
  const popularity = artist.popularity ? `#${artist.popularity}` : '—';
  const gender = artist.gender || 'Unknown';
  const genre = artist.genres && artist.genres.length > 0 
    ? artist.genres[0].charAt(0).toUpperCase() + artist.genres[0].slice(1) 
    : 'Unknown';
  const country = artist.country || '';
  const countryFlag = country && countryFlags[country] ? countryFlags[country] : '';

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Artist image and name */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
          {artist.imageUrl ? (
            <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{artist.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-white">{artist.name}</h2>
      </div>

      {/* Artist details grid */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {/* Debut */}
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-1">Debut</span>
          <span className="text-white text-xl font-semibold">{debut}</span>
        </div>

        {/* Members */}
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-1">Members</span>
          <span className="text-white text-xl font-semibold">{members}</span>
        </div>

        {/* Popularity */}
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-1">Popularity</span>
          <span className="text-white text-xl font-semibold">{popularity}</span>
        </div>

        {/* Gender */}
        <div className="bg-green-800 bg-opacity-50 rounded-lg p-3 flex flex-col items-center">
          <span className="text-gray-300 text-sm mb-1">Gender</span>
          <span className="text-white text-xl font-semibold">{gender}</span>
        </div>

        {/* Genre */}
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-1">Genre</span>
          <span className="text-white text-xl font-semibold">{genre}</span>
        </div>

        {/* Country */}
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-1">Country</span>
          <div className="flex flex-col items-center">
            {countryFlag && (
              <span className="text-2xl mb-1">{countryFlag}</span>
            )}
            <span className="text-white text-lg font-semibold">{country || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}