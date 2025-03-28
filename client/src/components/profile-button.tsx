
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export default function ProfileButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    // Spotify OAuth URL - we'll need to set up the server endpoint for this
    window.location.href = '/api/auth/spotify';
  };

  const handleLogout = () => {
    // TODO: Implement logout
    setIsLoggedIn(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="flex items-center gap-2 text-white hover:bg-white/10"
        onClick={isLoggedIn ? handleLogout : handleLogin}
      >
        <User className="h-5 w-5" />
        {isLoggedIn ? (
          <>
            <span>Profile</span>
            <LogOut className="h-4 w-4" />
          </>
        ) : (
          <span>Connect with Spotify</span>
        )}
      </Button>
    </div>
  );
}
