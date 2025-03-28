export default function GameInstructions() {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Guess the Spotify Artist</h2>
      <p className="text-[#B3B3B3] max-w-lg mx-auto mb-6">
        Type an artist name in the search box below. Try to guess the hidden artist to earn points. 
        You have 5 attempts to get it right!
      </p>
      <div className="flex justify-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center">
          <span className="font-bold">1</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center opacity-60">
          <span className="font-bold">2</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center opacity-40">
          <span className="font-bold">3</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center opacity-30">
          <span className="font-bold">4</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center opacity-20">
          <span className="font-bold">5</span>
        </div>
      </div>
    </div>
  );
}
