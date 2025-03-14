import React from 'react';
import { Leaf } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Leaf className="h-8 w-8" />
          <h1 className="text-2xl font-bold">RocketFood</h1>
        </div>
        <div className="text-sm md:text-base">
          <span className="font-medium">Ingredient Scanner & Analyzer</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
