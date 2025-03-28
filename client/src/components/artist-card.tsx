import React from 'react';
import { ArtistWithDetails } from '@shared/types';

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

interface ArtistCardProps {
  artist: ArtistWithDetails;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
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
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden mb-4">
      <div className="flex items-center p-4 pb-3">
        <div className="w-20 h-20 rounded-full overflow-hidden mr-4">
          {artist.imageUrl ? (
            <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{artist.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-white">{artist.name}</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-2 p-2">
        {/* Debut */}
        <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center">
          <span className="text-gray-400 text-xs">Debut</span>
          <span className="text-white text-lg font-semibold">{debut}</span>
        </div>

        {/* Members */}
        <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center">
          <span className="text-gray-400 text-xs">Members</span>
          <span className="text-white text-lg font-semibold">{members}</span>
        </div>

        {/* Popularity */}
        <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center">
          <span className="text-gray-400 text-xs">Popularity</span>
          <span className="text-white text-lg font-semibold">{popularity}</span>
        </div>

        {/* Gender */}
        <div className="bg-green-800 bg-opacity-50 rounded-lg p-2 flex flex-col items-center">
          <span className="text-gray-300 text-xs">Gender</span>
          <span className="text-white text-lg font-semibold">{gender}</span>
        </div>

        {/* Genre */}
        <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center">
          <span className="text-gray-400 text-xs">Genre</span>
          <span className="text-white text-lg font-semibold">{genre}</span>
        </div>

        {/* Country */}
        <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center">
          <span className="text-gray-400 text-xs">Country</span>
          <div className="flex flex-col items-center">
            {countryFlag && (
              <span className="text-xl">{countryFlag}</span>
            )}
            <span className="text-white text-sm font-semibold">{country || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}