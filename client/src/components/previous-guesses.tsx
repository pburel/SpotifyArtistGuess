import { ArtistWithDetails } from "@shared/types";
import { CheckCircle, XCircle } from "lucide-react";
import ArtistCard from "./artist-card";

interface PreviousGuessesProps {
  guesses: ArtistWithDetails[];
}

export default function PreviousGuesses({ guesses }: PreviousGuessesProps) {
  if (guesses.length === 0) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Previous Guesses</h2>
      {guesses.map((guess, index) => (
        <div key={`${guess.id}-${index}`} className="mb-6">
          <ArtistCard artist={guess} />
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
