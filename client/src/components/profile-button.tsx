
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfileButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    window.location.href = '/api/auth/spotify';
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="flex items-center gap-3 text-white hover:bg-white/10 rounded-full px-4 py-2"
        onClick={isLoggedIn ? handleLogout : handleLogin}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={isLoggedIn ? "/user-avatar.jpg" : ""} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <span className="font-medium">Profile</span>
            <LogOut className="h-4 w-4" />
          </div>
        ) : (
          <span className="font-medium">Connect with Spotify</span>
        )}
      </Button>
    </div>
  );
}
