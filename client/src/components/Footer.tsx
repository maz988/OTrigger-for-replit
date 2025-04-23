import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-pink-100 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <hr className="w-12 border-pink-100" />
            <Heart className="h-5 w-5 mx-2 text-pink-300 fill-pink-100" />
            <hr className="w-12 border-pink-100" />
          </div>
          
          <p className="text-sm text-neutral-500 mb-3">
            &copy; {new Date().getFullYear()} Obsession Trigger. All rights reserved.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-y-2 sm:gap-y-0 sm:space-x-6 mt-2">
            <a href="#" className="text-sm text-blue-500 hover:text-pink-500 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-blue-500 hover:text-pink-500 transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-blue-500 hover:text-pink-500 transition-colors">Contact Us</a>
          </div>
          
          <p className="text-xs text-neutral-400 mt-6">
            This site is not affiliated with Facebook, Instagram, or any other social media platform.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
