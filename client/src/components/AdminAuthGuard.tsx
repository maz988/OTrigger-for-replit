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

  const { data: adminDataResponse, isLoading, isError } = useQuery({
    queryKey: ['/api/admin/me'],
    queryFn: getQueryFn<AdminUser>({ on401: 'silent' }),
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