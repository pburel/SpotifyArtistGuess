export default function Footer() {
  return (
    <footer className="py-6 px-4 text-center text-[#B3B3B3] text-sm">
      <p>Not affiliated with Spotify. Made for music lovers. All artist data from Spotify API.</p>
      <div className="mt-2 flex justify-center gap-4">
        <a href="#" className="hover:text-[#1DB954] transition-colors">About</a>
        <a href="#" className="hover:text-[#1DB954] transition-colors">Privacy</a>
        <a href="#" className="hover:text-[#1DB954] transition-colors">Contact</a>
      </div>
    </footer>
  );
}
