import Header from "./components/header";
import ProfileButton from "./components/profile-button";

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex justify-between items-center p-4">
        <Header />
        <ProfileButton />
      </div>
      {/* Rest of the app content */}
    </div>
  );
}

export default App;