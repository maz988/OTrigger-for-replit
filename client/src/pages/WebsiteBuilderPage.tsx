import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import PageManager from '@/components/website-builder/PageManager';
import WebsiteBuilder from '@/components/website-builder/WebsiteBuilder';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

enum BuilderMode {
  LIST,
  EDIT,
  NEW
}

const WebsiteBuilderPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const params = useParams();
  const pageId = params?.pageId;
  
  const [mode, setMode] = useState<BuilderMode>(
    pageId ? BuilderMode.EDIT : BuilderMode.LIST
  );
  const [currentPageId, setCurrentPageId] = useState<string | undefined>(pageId);
  
  const handleBack = () => {
    setMode(BuilderMode.LIST);
    setCurrentPageId(undefined);
    setLocation('/admin?tab=website');
  };
  
  const handleEditPage = (id: string) => {
    setCurrentPageId(id);
    setMode(BuilderMode.EDIT);
    setLocation(`/admin/website/page/${id}`);
  };
  
  const handleNewPage = () => {
    setCurrentPageId(undefined);
    setMode(BuilderMode.NEW);
  };
  
  return (
    <div className="container mx-auto py-6">
      {mode === BuilderMode.LIST && (
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Link href="/admin">
              <Button variant="ghost" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Website Builder</h1>
          </div>
          
          <PageManager 
            onEditPage={handleEditPage}
            onNewPage={handleNewPage}
          />
        </div>
      )}
      
      {(mode === BuilderMode.EDIT || mode === BuilderMode.NEW) && (
        <WebsiteBuilder 
          pageId={currentPageId}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default WebsiteBuilderPage;