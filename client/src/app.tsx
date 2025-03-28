import Header from "./components/header";
import ProfileButton from "./components/profile-button";

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
          <Header />
          <ProfileButton />
        </div>
      </header>
      <div className="pt-16">
        {/* Rest of the app content */}
      </div>
    </div>
  );
}

export default App;