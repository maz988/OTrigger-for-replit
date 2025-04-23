import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import LeadMagnetForm from './LeadMagnetForm';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QuizResultsLeadCaptureProps {
  title?: string;
  description?: string;
  leadMagnetName?: string;
  previewText?: string;
  onSkip?: () => void;
}

/**
 * Lead capture component that appears after quiz completion
 */
export default function QuizResultsLeadCapture({
  title = "Get the Full Report + Weekly Relationship Tips",
  description = "Enter your details below to access your complete personalized relationship analysis and receive weekly advice tailored to your situation.",
  leadMagnetName = "Personalized Relationship Analysis",
  previewText = "Your quiz results contain valuable insights based on relationship psychology and male emotional patterns...",
  onSkip
}: QuizResultsLeadCaptureProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg border-[#f24b7c]/20">
        <CardHeader className="text-center pb-4 bg-gradient-to-br from-[#ffedf1]/50 to-white">
          <CardTitle className="text-xl text-[#f24b7c]">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="mb-6 p-4 border border-dashed rounded-md bg-muted/30">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold block mb-1 text-gray-800">Preview of Your Results:</span>
              {previewText}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3 border-[#f24b7c]/30 text-[#f24b7c] hover:bg-[#ffedf1] hover:text-[#f24b7c]"
              disabled
            >
              <Download className="h-4 w-4 mr-2 opacity-50" />
              Complete Report (Locked)
            </Button>
          </div>
          
          <LeadMagnetForm
            source="quiz-results"
            title=""
            description=""
            leadMagnetName={leadMagnetName}
            variant="inline"
          />
        </CardContent>
        
        {onSkip && (
          <CardFooter className="flex justify-center pt-2 pb-4">
            <Button 
              variant="link" 
              onClick={onSkip}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Skip for now (results won't be saved)
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}