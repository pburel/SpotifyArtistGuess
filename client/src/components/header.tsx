
interface HeaderProps {
  score: number;
}

import ProfileButton from "./profile-button";

export default function Header({ score }: HeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center">
        <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#1DB954"/>
          <path d="M16.7502 16.5C16.7502 16.6326 16.7106 16.7598 16.639 16.866C16.5673 16.9723 16.4677 17.0528 16.3534 17.0971C16.239 17.1415 16.1148 17.1474 15.9969 17.114C15.879 17.0805 15.7733 17.0091 15.694 16.9092C15.6146 16.8094 15.5662 16.6845 15.5552 16.5537C15.5442 16.4229 15.5712 16.2921 15.6328 16.1792C15.6944 16.0664 15.7876 15.9771 15.8999 15.9232C16.0122 15.8693 16.1375 15.8539 16.2582 15.8787C16.4124 15.9109 16.5468 16.003 16.6338 16.1368C16.7209 16.2707 16.7537 16.4353 16.7246 16.5945L16.7502 16.5Z" fill="#191414"/>
          <path d="M16.5 7.5C16.5 7.5 11.5 6.5 8.5 9C8.5 9 7.10858 10.2543 7 12.5C7 12.5 7 15 9.5 16C9.5 16 12.0755 17.1645 14.5 16C14.5 16 16.9427 15.331 17 12C17 12 17.0573 8.63462 13.5 8" stroke="#191414" strokeLinecap="round"/>
        </svg>
        <h1 className="text-xl font-bold text-white">Spotle<span className="text-[#1DB954]">.io</span></h1>
        <div className="ml-4 bg-[#AF2896] px-3 py-1 rounded-full text-white text-sm font-semibold">
          Score: <span>{score}</span>
        </div>
      </div>
      <ProfileButton />
    </div>
  );
}
