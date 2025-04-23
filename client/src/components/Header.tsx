import React from 'react';
import { Heart } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-center items-center">
        <a href="/" className="flex items-center">
          <h1 className="font-script text-3xl text-[#f24b7c]">
            Obsession Trigger AI
          </h1>
          <Heart className="ml-1 h-4 w-4 text-[#f24b7c] fill-[#fbb5c8]" />
        </a>
      </div>
    </header>
  );
};

export default Header;
