import { useState, useEffect } from "react";
import Header from "@/components/header";
import GameInstructions from "@/components/game-instructions";
import SearchBar from "@/components/search-bar";
import GameStatus from "@/components/game-status";
import PreviousGuesses from "@/components/previous-guesses";
import GameResult from "@/components/game-result";
import Footer from "@/components/footer";
import { GameState, ArtistWithDetails } from "@shared/types";
import { startNewGame, processGuess, generateHint, MAX_ATTEMPTS } from "@/lib/game";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [gameState, setGameState] = useState<GameState>({
    isGameActive: false,
    targetArtist: null,
    attemptsLeft: MAX_ATTEMPTS,
    maxAttempts: MAX_ATTEMPTS,
    previousGuesses: [],
    isCorrect: null,
    score: 0,
    hintIndex: 0
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [showResult, setShowResult] = useState<boolean>(false);
  const { toast } = useToast();

  // Start a new game
  const initGame = async () => {
    try {
      setLoading(true);
      const newGameState = await startNewGame();
      setGameState(newGameState);
      setShowInstructions(true);
      setShowResult(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start a new game. Please try again.",
        variant: "destructive"
      });
      console.error("Failed to start game:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial game setup
  useEffect(() => {
    initGame();
  }, []);

  // Handle artist guess
  const handleGuess = (artist: ArtistWithDetails) => {
    try {
      // Process the guess and update game state
      const newState = processGuess(gameState, artist);
      setGameState(newState);
      
      // Hide instructions after first guess
      setShowInstructions(false);
      
      // Show result if game is over
      if (!newState.isGameActive && newState.isCorrect !== null) {
        setTimeout(() => {
          setShowResult(true);
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong processing your guess.",
        variant: "destructive"
      });
      console.error("Error processing guess:", error);
    }
  };

  // Play again after game over
  const handlePlayAgain = () => {
    setShowResult(false);
    initGame();
  };

  // Share results
  const handleShareResults = () => {
    if (!gameState.targetArtist) return;
    
    const attemptsUsed = MAX_ATTEMPTS - gameState.attemptsLeft;
    const resultText = `I ${gameState.isCorrect ? 'guessed' : 'failed to guess'} the Spotify artist ${gameState.targetArtist.name} in ${attemptsUsed}/${MAX_ATTEMPTS} attempts on Spotle.io! Score: ${gameState.score}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Spotle.io Result',
        text: resultText,
        url: window.location.href,
      })
      .catch(error => {
        console.error('Error sharing:', error);
        copyToClipboard(resultText);
      });
    } else {
      copyToClipboard(resultText);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Result copied to clipboard",
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast({
        title: "Failed to copy",
        description: "Please try again or share manually",
        variant: "destructive"
      });
    });
  };

  // Get the current hint based on game state
  const currentHint = generateHint(gameState);

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white font-sans">
      <Header score={gameState.score} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {showInstructions && <GameInstructions />}
        
        <SearchBar onGuess={handleGuess} disabled={!gameState.isGameActive || loading} />
        
        <GameStatus
          currentAttempt={MAX_ATTEMPTS - gameState.attemptsLeft + 1}
          maxAttempts={MAX_ATTEMPTS}
          hint={currentHint}
          showHint={gameState.hintIndex > 0 && gameState.previousGuesses.length > 0}
          targetArtistName={gameState.targetArtist?.name}
        />
        
        <PreviousGuesses guesses={gameState.previousGuesses} targetArtist={gameState.targetArtist} />
        
        <GameResult
          isOpen={showResult}
          isCorrect={gameState.isCorrect === true}
          targetArtist={gameState.targetArtist}
          attemptsUsed={MAX_ATTEMPTS - gameState.attemptsLeft}
          onPlayAgain={handlePlayAgain}
          onShare={handleShareResults}
        />
      </main>
      
      <Footer />
    </div>
  );
}
