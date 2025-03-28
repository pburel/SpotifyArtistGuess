interface GameStatusProps {
  currentAttempt: number;
  maxAttempts: number;
  hint: string;
  showHint: boolean;
}

export default function GameStatus({ 
  currentAttempt, 
  maxAttempts, 
  hint, 
  showHint 
}: GameStatusProps) {
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
    </div>
  );
}
