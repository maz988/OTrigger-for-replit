import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  FileText,
  Users,
  Settings,
  Home,
  LayoutDashboard,
  Globe
} from 'lucide-react';

const AdminNavigation: React.FC = () => {
  const [location] = useLocation();
  
  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5 mr-2" />,
      active: location === '/admin'
    },
    {
      label: 'Quiz Analytics',
      href: '/admin/quiz-analytics',
      icon: <BarChart3 className="h-5 w-5 mr-2" />,
      active: location === '/admin/quiz-analytics'
    },
    {
      label: 'Blog Management',
      href: '/admin/blog-management',
      icon: <FileText className="h-5 w-5 mr-2" />,
      active: location === '/admin/blog-management'
    },
    {
      label: 'Website Builder',
      href: '/admin/website',
      icon: <Globe className="h-5 w-5 mr-2" />,
      active: location.startsWith('/admin/website')
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5 mr-2" />,
      active: location === '/admin/settings'
    }
  ];

  return (
    <div className="mb-8 bg-card shadow rounded-lg p-4">
      <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={item.active ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link href={item.href} className="flex items-center">
              {item.icon}
              {item.label}
            </Link>
          </Button>
        ))}
        <Button variant="outline" size="sm" asChild>
          <Link href="/" className="flex items-center">
            <Home className="h-5 w-5 mr-2" />
            View Site
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default AdminNavigation;