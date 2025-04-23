import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-100 py-6">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Obsession Trigger AI. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="#" className="text-sm text-neutral-500 hover:text-primary-500 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-neutral-500 hover:text-primary-500 transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-neutral-500 hover:text-primary-500 transition-colors">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
