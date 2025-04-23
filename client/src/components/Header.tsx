import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold font-poppins text-primary-500">
            <span className="font-script">Obsession</span> Trigger AI
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
