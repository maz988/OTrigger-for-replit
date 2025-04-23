import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

interface AdminUser {
  username: string;
  email: string;
  role: string;
}

const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const [_, setLocation] = useLocation();

  // Get the token from localStorage
  const token = localStorage.getItem('adminToken');
  
  const { data: adminDataResponse, isLoading, isError } = useQuery({
    queryKey: ['/api/admin/me'],
    queryFn: async () => {
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }
      
      const response = await fetch('/api/admin/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Not authenticated' };
        }
        const error = await response.text();
        throw new Error(error || `Error ${response.status}`);
      }
      
      return await response.json();
    },
    retry: false,
  });

  // Check if we have valid admin data
  const adminData = adminDataResponse?.success && adminDataResponse?.data ? 
    adminDataResponse.data : null;

  React.useEffect(() => {
    if (isError || (adminDataResponse && !adminData)) {
      setLocation('/admin/login');
    }
  }, [isError, adminData, adminDataResponse, setLocation]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-[#f24b7c] animate-spin" />
      </div>
    );
  }

  // If we have admin data, render the children
  if (adminData) {
    return <>{children}</>;
  }

  // This should never show as the useEffect should redirect
  return null;
};

export default AdminAuthGuard;