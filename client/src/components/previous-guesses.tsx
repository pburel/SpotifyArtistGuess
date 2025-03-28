import { ArtistWithDetails } from "@shared/types";
import { CheckCircle, XCircle } from "lucide-react";

interface PreviousGuessesProps {
  guesses: ArtistWithDetails[];
}

export default function PreviousGuesses({ guesses }: PreviousGuessesProps) {
  if (guesses.length === 0) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mb-8">
      {guesses.map((guess, index) => (
        <div 
          key={`${guess.id}-${index}`}
          className="bg-[#191414] bg-opacity-60 rounded-lg p-4 mb-3 flex items-center transition-all hover:bg-opacity-80"
        >
          <div className="w-16 h-16 rounded overflow-hidden mr-4">
            {guess.imageUrl ? (
              <img src={guess.imageUrl} alt={guess.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-lg font-bold">{guess.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-lg">{guess.name}</h3>
            <p className="text-[#B3B3B3] text-sm">
              {guess.genres.length > 0 
                ? `${guess.genres.slice(0, 2).join(', ')}${guess.genres.length > 2 ? '...' : ''}`
                : 'Unknown genre'
              } • {formatNumber(guess.monthlyListeners || 0)} monthly listeners
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center ml-4">
            <XCircle className="h-6 w-6" />
          </div>
        </div>
      ))}
    </div>
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
