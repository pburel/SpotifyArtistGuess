import React from 'react';
import { ArtistWithDetails } from '@shared/types';

// Map country codes to flag emojis
const countryFlags: Record<string, string> = {
  'AD': '🇦🇩', 'AE': '🇦🇪', 'AF': '🇦🇫', 'AG': '🇦🇬', 'AI': '🇦🇮', 'AL': '🇦🇱', 'AM': '🇦🇲', 'AO': '🇦🇴', 
  'AR': '🇦🇷', 'AS': '🇦🇸', 'AT': '🇦🇹', 'AU': '🇦🇺', 'AW': '🇦🇼', 'AX': '🇦🇽', 'AZ': '🇦🇿', 'BA': '🇧🇦', 
  'BB': '🇧🇧', 'BD': '🇧🇩', 'BE': '🇧🇪', 'BF': '🇧🇫', 'BG': '🇧🇬', 'BH': '🇧🇭', 'BI': '🇧🇮', 'BJ': '🇧🇯', 
  'BL': '🇧🇱', 'BM': '🇧🇲', 'BN': '🇧🇳', 'BO': '🇧🇴', 'BR': '🇧🇷', 'BS': '🇧🇸', 'BT': '🇧🇹', 'BV': '🇧🇻', 
  'BW': '🇧🇼', 'BY': '🇧🇾', 'BZ': '🇧🇿', 'CA': '🇨🇦', 'CC': '🇨🇨', 'CD': '🇨🇩', 'CF': '🇨🇫', 'CG': '🇨🇬', 
  'CH': '🇨🇭', 'CI': '🇨🇮', 'CK': '🇨🇰', 'CL': '🇨🇱', 'CM': '🇨🇲', 'CN': '🇨🇳', 'CO': '🇨🇴', 'CR': '🇨🇷', 
  'CU': '🇨🇺', 'CV': '🇨🇻', 'CW': '🇨🇼', 'CX': '🇨🇽', 'CY': '🇨🇾', 'CZ': '🇨🇿', 'DE': '🇩🇪', 'DJ': '🇩🇯', 
  'DK': '🇩🇰', 'DM': '🇩🇲', 'DO': '🇩🇴', 'DZ': '🇩🇿', 'EC': '🇪🇨', 'EE': '🇪🇪', 'EG': '🇪🇬', 'EH': '🇪🇭', 
  'ER': '🇪🇷', 'ES': '🇪🇸', 'ET': '🇪🇹', 'FI': '🇫🇮', 'FJ': '🇫🇯', 'FK': '🇫🇰', 'FM': '🇫🇲', 'FO': '🇫🇴', 
  'FR': '🇫🇷', 'GA': '🇬🇦', 'GB': '🇬🇧', 'GD': '🇬🇩', 'GE': '🇬🇪', 'GF': '🇬🇫', 'GG': '🇬🇬', 'GH': '🇬🇭', 
  'GI': '🇬🇮', 'GL': '🇬🇱', 'GM': '🇬🇲', 'GN': '🇬🇳', 'GP': '🇬🇵', 'GQ': '🇬🇶', 'GR': '🇬🇷', 'GS': '🇬🇸', 
  'GT': '🇬🇹', 'GU': '🇬🇺', 'GW': '🇬🇼', 'GY': '🇬🇾', 'HK': '🇭🇰', 'HM': '🇭🇲', 'HN': '🇭🇳', 'HR': '🇭🇷', 
  'HT': '🇭🇹', 'HU': '🇭🇺', 'ID': '🇮🇩', 'IE': '🇮🇪', 'IL': '🇮🇱', 'IM': '🇮🇲', 'IN': '🇮🇳', 'IO': '🇮🇴', 
  'IQ': '🇮🇶', 'IR': '🇮🇷', 'IS': '🇮🇸', 'IT': '🇮🇹', 'JE': '🇯🇪', 'JM': '🇯🇲', 'JO': '🇯🇴', 'JP': '🇯🇵', 
  'KE': '🇰🇪', 'KG': '🇰🇬', 'KH': '🇰🇭', 'KI': '🇰🇮', 'KM': '🇰🇲', 'KN': '🇰🇳', 'KP': '🇰🇵', 'KR': '🇰🇷', 
  'KW': '🇰🇼', 'KY': '🇰🇾', 'KZ': '🇰🇿', 'LA': '🇱🇦', 'LB': '🇱🇧', 'LC': '🇱🇨', 'LI': '🇱🇮', 'LK': '🇱🇰', 
  'LR': '🇱🇷', 'LS': '🇱🇸', 'LT': '🇱🇹', 'LU': '🇱🇺', 'LV': '🇱🇻', 'LY': '🇱🇾', 'MA': '🇲🇦', 'MC': '🇲🇨', 
  'MD': '🇲🇩', 'ME': '🇲🇪', 'MF': '🇲🇫', 'MG': '🇲🇬', 'MH': '🇲🇭', 'MK': '🇲🇰', 'ML': '🇲🇱', 'MM': '🇲🇲', 
  'MN': '🇲🇳', 'MO': '🇲🇴', 'MP': '🇲🇵', 'MQ': '🇲🇶', 'MR': '🇲🇷', 'MS': '🇲🇸', 'MT': '🇲🇹', 'MU': '🇲🇺', 
  'MV': '🇲🇻', 'MW': '🇲🇼', 'MX': '🇲🇽', 'MY': '🇲🇾', 'MZ': '🇲🇿', 'NA': '🇳🇦', 'NC': '🇳🇨', 'NE': '🇳🇪', 
  'NF': '🇳🇫', 'NG': '🇳🇬', 'NI': '🇳🇮', 'NL': '🇳🇱', 'NO': '🇳🇴', 'NP': '🇳🇵', 'NR': '🇳🇷', 'NU': '🇳🇺', 
  'NZ': '🇳🇿', 'OM': '🇴🇲', 'PA': '🇵🇦', 'PE': '🇵🇪', 'PF': '🇵🇫', 'PG': '🇵🇬', 'PH': '🇵🇭', 'PK': '🇵🇰', 
  'PL': '🇵🇱', 'PM': '🇵🇲', 'PN': '🇵🇳', 'PR': '🇵🇷', 'PS': '🇵🇸', 'PT': '🇵🇹', 'PW': '🇵🇼', 'PY': '🇵🇾', 
  'QA': '🇶🇦', 'RE': '🇷🇪', 'RO': '🇷🇴', 'RS': '🇷🇸', 'RU': '🇷🇺', 'RW': '🇷🇼', 'SA': '🇸🇦', 'SB': '🇸🇧', 
  'SC': '🇸🇨', 'SD': '🇸🇩', 'SE': '🇸🇪', 'SG': '🇸🇬', 'SH': '🇸🇭', 'SI': '🇸🇮', 'SJ': '🇸🇯', 'SK': '🇸🇰', 
  'SL': '🇸🇱', 'SM': '🇸🇲', 'SN': '🇸🇳', 'SO': '🇸🇴', 'SR': '🇸🇷', 'SS': '🇸🇸', 'ST': '🇸🇹', 'SV': '🇸🇻', 
  'SX': '🇸🇽', 'SY': '🇸🇾', 'SZ': '🇸🇿', 'TC': '🇹🇨', 'TD': '🇹🇩', 'TF': '🇹🇫', 'TG': '🇹🇬', 'TH': '🇹🇭', 
  'TJ': '🇹🇯', 'TK': '🇹🇰', 'TL': '🇹🇱', 'TM': '🇹🇲', 'TN': '🇹🇳', 'TO': '🇹🇴', 'TR': '🇹🇷', 'TT': '🇹🇹', 
  'TV': '🇹🇻', 'TW': '🇹🇼', 'TZ': '🇹🇿', 'UA': '🇺🇦', 'UG': '🇺🇬', 'UK': '🇬🇧', 'US': '🇺🇸', 'UY': '🇺🇾', 
  'UZ': '🇺🇿', 'VA': '🇻🇦', 'VC': '🇻🇨', 'VE': '🇻🇪', 'VG': '🇻🇬', 'VI': '🇻🇮', 'VN': '🇻🇳', 'VU': '🇻🇺', 
  'WF': '🇼🇫', 'WS': '🇼🇸', 'YE': '🇾🇪', 'YT': '🇾🇹', 'ZA': '🇿🇦', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
};

interface ArtistCardProps {
  artist: ArtistWithDetails;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  // Set default values for missing data
  const debut = artist.debutYear || '—';
  const members = artist.members ? artist.members.toString() : 'Solo';
  const popularity = artist.popularity ? `#${artist.popularity}` : '—';
  
  // Determine gender display value
  let gender = '';
  if (artist.gender === 'Group') {
    gender = 'Group';
  } else if (artist.gender === 'Male' || artist.gender === 'male') {
    gender = 'Male';
  } else if (artist.gender === 'Female' || artist.gender === 'female') {
    gender = 'Female';
  } else if (artist.gender === 'Other' || artist.gender === 'other') {
    gender = 'Other';
  } else if (artist.name.includes(' Band') || artist.name.includes('Orchestra')) {
    gender = 'Group';
  } else {
    // If we still can't determine, make an educated guess
    const femaleNames = ['Lady', 'Queen', 'Girl', 'Beyoncé', 'Rihanna', 'Adele', 'Madonna', 'Dua Lipa'];
    if (femaleNames.some(name => artist.name.includes(name))) {
      gender = 'Female';
    } else {
      gender = 'Unknown';
    }
  }
  
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