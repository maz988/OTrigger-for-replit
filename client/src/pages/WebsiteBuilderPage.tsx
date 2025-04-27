import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * Stub file for Website Builder page
 * This component is kept as a placeholder to prevent import errors,
 * but its functionality has been removed as requested by the user.
 */
const WebsiteBuilderPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link href="/admin">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Website Builder</h1>
      </div>
      
      <div className="p-12 text-center border rounded-md bg-muted/10">
        <p className="text-muted-foreground">The Website Builder functionality has been removed.</p>
      </div>
    </div>
  );
};

export default WebsiteBuilderPage;