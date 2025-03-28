import { ArtistWithDetails, GameState } from "@shared/types";
import { CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface PreviousGuessesProps {
  guesses: ArtistWithDetails[];
  targetArtist?: ArtistWithDetails | null;
}

export default function PreviousGuesses({ guesses, targetArtist }: PreviousGuessesProps) {
  if (guesses.length === 0) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Previous Guesses</h2>
      {guesses.map((guess, index) => (
        <div key={`${guess.id}-${index}`} className="mb-6">
          <GuessCard guess={guess} targetArtist={targetArtist} />
        </div>
      ))}
    </div>
  );
}

interface GuessCardProps {
  guess: ArtistWithDetails;
  targetArtist?: ArtistWithDetails | null;
}

function GuessCard({ guess, targetArtist }: GuessCardProps) {
  // Can't do comparisons without target artist
  if (!targetArtist) {
    return (
      <div className="w-full bg-gray-900 rounded-lg overflow-hidden mb-4">
        <SimpleGuessCard guess={guess} />
      </div>
    );
  }

  // Compare debut years if both are available
  const guessYear = guess.debutYear ? parseInt(guess.debutYear) : 0;
  const targetYear = targetArtist.debutYear ? parseInt(targetArtist.debutYear) : 0; 
  
  let yearComparison: JSX.Element | null = null;
  if (guessYear && targetYear) {
    if (guessYear < targetYear) {
      yearComparison = (
        <div className="arrow-icon app-spot-guess">
          <svg focusable="false" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="white">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"></path>
          </svg>
        </div>
      );
    } else if (guessYear > targetYear) {
      yearComparison = (
        <div className="arrow-icon app-spot-guess">
          <svg focusable="false" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="white">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"></path>
          </svg>
        </div>
      );
    } else {
      yearComparison = (
        <div className="arrow-icon app-spot-guess text-green-400">
          <svg focusable="false" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
          </svg>
        </div>
      );
    }
  }
  
  // Compare popularity
  const guessPopularity = guess.popularity || 0;
  const targetPopularity = targetArtist.popularity || 0;
  
  let popularityComparison: JSX.Element | null = null;
  if (guessPopularity < targetPopularity) {
    popularityComparison = (
      <div className="arrow-icon app-spot-guess">
        <svg focusable="false" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="white">
          <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"></path>
        </svg>
      </div>
    );
  } else if (guessPopularity > targetPopularity) {
    popularityComparison = (
      <div className="arrow-icon app-spot-guess">
        <svg focusable="false" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="white">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"></path>
        </svg>
      </div>
    );
  } else {
    popularityComparison = (
      <div className="arrow-icon app-spot-guess text-green-400">
        <svg focusable="false" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
        </svg>
      </div>
    );
  }
  
  // Gender comparison - exact match only
  const genderMatch = (
    (guess.gender === targetArtist.gender) || 
    (guess.gender?.toLowerCase() === targetArtist.gender?.toLowerCase())
  );
  
  // Country comparison - exact match only
  const countryMatch = guess.country === targetArtist.country;
  
  // Set up flags
  const countryFlags: Record<string, string> = {
    'US': '🇺🇸', 'UK': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'SE': '🇸🇪',
    'KR': '🇰🇷', 'JP': '🇯🇵', 'BR': '🇧🇷', 'ES': '🇪🇸', 'DE': '🇩🇪',
    'FR': '🇫🇷', 'IT': '🇮🇹', 'CO': '🇨🇴', 'BB': '🇧🇧', 'JM': '🇯🇲',
    'IS': '🇮🇸'
  };
  
  const guessFlag = guess.country && countryFlags[guess.country] ? countryFlags[guess.country] : '';
  
  // Convert popularity to rank format with # prefix
  const popularity = guess.popularity ? `#${guess.popularity}` : '—';
  
  // Determine gender display value
  let gender = '';
  if (guess.gender === 'Group') {
    gender = 'Group';
  } else if (guess.gender === 'Male' || guess.gender === 'male') {
    gender = 'Male';
  } else if (guess.gender === 'Female' || guess.gender === 'female') {
    gender = 'Female';
  } else if (guess.gender === 'Other' || guess.gender === 'other') {
    gender = 'Other';
  } else {
    gender = 'Unknown';
  }
  
  // Get first genre with capitalization
  const genre = guess.genres && guess.genres.length > 0 
    ? guess.genres[0].charAt(0).toUpperCase() + guess.genres[0].slice(1) 
    : 'Unknown';
  
  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden mb-4">
      <div className="flex items-center p-4 pb-3">
        <div className="w-20 h-20 rounded-full overflow-hidden mr-4">
          {guess.imageUrl ? (
            <img src={guess.imageUrl} alt={guess.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{guess.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-white">{guess.name}</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-2 p-2">
        {/* Debut */}
        <div className={`rounded-lg p-2 flex flex-col items-center app-spot-guess ${guessYear === targetYear ? 'correct' : 'bg-gray-800'}`}>
          <span className="text-gray-400 text-xs">Debut</span>
          <div className="flex items-center">
            <span className="text-white text-lg font-semibold">{guess.debutYear || '—'}</span>
            {yearComparison}
          </div>
        </div>

        {/* Members */}
        <div className={`rounded-lg p-2 flex flex-col items-center app-spot-guess ${guess.members === targetArtist.members ? 'correct' : 'bg-gray-800'}`}>
          <span className="text-gray-400 text-xs">Members</span>
          <span className="text-white text-lg font-semibold">
            {guess.members ? (guess.members > 1 ? guess.members.toString() : 'Solo') : 'Solo'}
          </span>
        </div>

        {/* Popularity */}
        <div className={`rounded-lg p-2 flex flex-col items-center app-spot-guess ${guessPopularity === targetPopularity ? 'correct' : 'bg-gray-800'}`}>
          <span className="text-gray-400 text-xs">Popularity</span>
          <div className="flex items-center">
            <span className="text-white text-lg font-semibold">{popularity}</span>
            {popularityComparison}
          </div>
        </div>

        {/* Gender */}
        <div className={`rounded-lg p-2 flex flex-col items-center app-spot-guess ${genderMatch ? 'correct' : 'bg-gray-800'}`}>
          <span className="text-gray-300 text-xs">Gender</span>
          <span className="text-white text-lg font-semibold">{gender}</span>
        </div>

        {/* Genre */}
        <div className={`rounded-lg p-2 flex flex-col items-center app-spot-guess ${guess.genres?.[0] === targetArtist.genres?.[0] ? 'correct' : 'bg-gray-800'}`}>
          <span className="text-gray-400 text-xs">Genre</span>
          <span className="text-white text-lg font-semibold">{genre}</span>
        </div>

        {/* Country */}
        <div className={`rounded-lg p-2 flex flex-col items-center app-spot-guess ${countryMatch ? 'correct' : 'bg-gray-800'}`}>
          <span className="text-gray-400 text-xs">Country</span>
          <div className="flex flex-col items-center">
            {guessFlag && (
              <span className="text-xl">{guessFlag}</span>
            )}
            <span className="text-white text-sm font-semibold">{guess.country || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback component when target artist isn't available
function SimpleGuessCard({ guess }: { guess: ArtistWithDetails }) {
  // Set default values for missing data
  const debut = guess.debutYear || '—';
  const members = guess.members ? guess.members.toString() : 'Solo';
  const popularity = guess.popularity ? `#${guess.popularity}` : '—';
  
  // Determine gender display value
  let gender = '';
  if (guess.gender === 'Group') {
    gender = 'Group';
  } else if (guess.gender === 'Male' || guess.gender === 'male') {
    gender = 'Male';
  } else if (guess.gender === 'Female' || guess.gender === 'female') {
    gender = 'Female';
  } else if (guess.gender === 'Other' || guess.gender === 'other') {
    gender = 'Other';
  } else if (guess.name.includes(' Band') || guess.name.includes('Orchestra')) {
    gender = 'Group';
  } else {
    gender = 'Unknown';
  }
  
  const genre = guess.genres && guess.genres.length > 0 
    ? guess.genres[0].charAt(0).toUpperCase() + guess.genres[0].slice(1) 
    : 'Unknown';
  const country = guess.country || '';
  
  // Map country codes to flag emojis - simplified version
  const countryFlags: Record<string, string> = {
    'US': '🇺🇸', 'UK': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'SE': '🇸🇪',
    'KR': '🇰🇷', 'JP': '🇯🇵', 'BR': '🇧🇷', 'ES': '🇪🇸', 'DE': '🇩🇪',
    'FR': '🇫🇷', 'IT': '🇮🇹', 'CO': '🇨🇴', 'BB': '🇧🇧', 'JM': '🇯🇲',
    'IS': '🇮🇸'
  };
  
  const countryFlag = country && countryFlags[country] ? countryFlags[country] : '';

  return (
    <>
      <div className="flex items-center p-4 pb-3">
        <div className="w-20 h-20 rounded-full overflow-hidden mr-4">
          {guess.imageUrl ? (
            <img src={guess.imageUrl} alt={guess.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{guess.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-white">{guess.name}</h3>
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
        <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center">
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
    </>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
