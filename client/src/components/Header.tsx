import React from 'react';
import { Heart } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-pink-100">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-2 text-pink-500">
            <Heart className="h-5 w-5 fill-pink-200" />
          </div>
          <h1 className="text-2xl font-bold font-poppins bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            <span className="font-script">Obsession</span> Trigger
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
