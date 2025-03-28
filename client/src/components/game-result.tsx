import { ArtistWithDetails } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Check, X, Share2 } from "lucide-react";
import ArtistDetails from "./artist-details";

interface GameResultProps {
  isOpen: boolean;
  isCorrect: boolean;
  targetArtist: ArtistWithDetails | null;
  attemptsUsed: number;
  onPlayAgain: () => void;
  onShare: () => void;
}

export default function GameResult({ 
  isOpen, 
  isCorrect, 
  targetArtist, 
  attemptsUsed,
  onPlayAgain,
  onShare 
}: GameResultProps) {
  if (!isOpen || !targetArtist) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-[#191414] p-8 rounded-xl max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          {isCorrect ? (
            <div>
              <div className="w-20 h-20 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You got it!</h2>
              <p className="text-[#B3B3B3]">You guessed the artist in {attemptsUsed} tries</p>
            </div>
          ) : (
            <div>
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Better luck next time!</h2>
              <p className="text-[#B3B3B3]">The artist was:</p>
            </div>
          )}
        </div>
        
        <div className="bg-[#121212] bg-opacity-60 rounded-lg p-4 mb-6">
          <ArtistDetails artist={targetArtist} />
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={onPlayAgain}
            className="flex-1 bg-[#1DB954] hover:bg-opacity-80 text-black font-semibold rounded-full py-3 transition-all"
          >
            Play Again
          </Button>
          <Button
            onClick={onShare}
            className="flex-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold rounded-full py-3 transition-all"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Results
          </Button>
        </div>
      </div>
    </div>
  );
}
