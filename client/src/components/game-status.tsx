interface GameStatusProps {
  currentAttempt: number;
  maxAttempts: number;
  hint: string;
  showHint: boolean;
  targetArtistName?: string; // Optional prop for development mode
}

export default function GameStatus({ 
  currentAttempt, 
  maxAttempts, 
  hint, 
  showHint,
  targetArtistName
}: GameStatusProps) {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="mb-8 text-center">
      <div className="flex justify-center mb-4 gap-3">
        {Array.from({ length: maxAttempts }).map((_, index) => {
          const attemptNumber = index + 1;
          let className = "w-10 h-10 rounded-full flex items-center justify-center ";
          
          if (attemptNumber === currentAttempt) {
            className += "bg-white bg-opacity-10 border-2 border-[#1DB954]";
          } else if (attemptNumber < currentAttempt) {
            className += "bg-white bg-opacity-20";
          } else {
            className += "bg-white bg-opacity-10";
          }
          
          return (
            <div key={index} className={className}>
              <span className="font-bold">{attemptNumber}</span>
            </div>
          );
        })}
      </div>
      
      {showHint && (
        <div className="text-sm text-[#B3B3B3] mt-2 animate-fade-in">
          <p>Hint: <span>{hint}</span></p>
        </div>
      )}

      {/* Show target artist name in development mode */}
      {isDevelopment && targetArtistName && (
        <div className="text-sm text-[#1DB954] mt-2 border border-[#1DB954] p-1 rounded inline-block">
          <p>Hint: <span className="font-bold">{targetArtistName}</span></p>
        </div>
      )}
    </div>
  );
}
