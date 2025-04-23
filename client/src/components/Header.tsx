import React from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Heart, User } from 'lucide-react';
import { Button } from './ui/button';

interface AdminUser {
  username: string;
  role: string;
}

const Header: React.FC = () => {
  const [location] = useLocation();
  
  // Get the token from localStorage
  const token = localStorage.getItem('adminToken');
  
  const { data: adminDataResponse } = useQuery({
    queryKey: ['/api/admin/me'],
    queryFn: async () => {
      if (!token) {
        return { success: false };
      }
      
      const response = await fetch('/api/admin/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return { success: false };
        }
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    retry: false,
  });

  // Check if we have admin data
  const isAdmin = adminDataResponse?.success && adminDataResponse?.data;

  const getActiveClass = (path: string) => {
    const isActive = location === path || 
      (path !== '/' && location.startsWith(path));
    return isActive ? 'font-semibold text-[#f24b7c]' : 'text-gray-600 hover:text-[#f24b7c]';
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <h1 className="font-bold text-2xl text-[#f24b7c]">
            Obsession Trigger
          </h1>
          <Heart className="ml-1 h-4 w-4 text-[#f24b7c] fill-[#fbb5c8]" />
        </Link>
        
        <nav>
          <ul className="flex space-x-6 items-center">
            <li>
              <Link href="/" className={`transition-colors ${getActiveClass('/')}`}>
                Quiz
              </Link>
            </li>
            <li>
              <Link href="/blog" className={`transition-colors ${getActiveClass('/blog')}`}>
                Blog
              </Link>
            </li>
            {isAdmin ? (
              <li>
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <User className="mr-1 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
