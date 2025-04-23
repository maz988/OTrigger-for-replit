import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { downloadPDF, getPDFDataUrl } from '@/lib/pdf-generator';
import PDFPreview from './PDFPreview';
import { type EmailFormData } from '@shared/schema';
import { 
  CheckIcon, 
  FileTextIcon, 
  Eye, 
  Download, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle,
  Sparkles,
  Gift
} from 'lucide-react';

interface ResultsStepProps {
  advice: string;
  userData: EmailFormData;
  pdfDocument: any;
}

const ResultsStep: React.FC<ResultsStepProps> = ({ advice, userData, pdfDocument }) => {
  const handleDownloadPDF = () => {
    if (pdfDocument) {
      downloadPDF(pdfDocument, userData.firstName);
    }
  };

  const handleViewPDF = () => {
    if (pdfDocument) {
      const pdfUrl = getPDFDataUrl(pdfDocument);
      window.open(pdfUrl, '_blank');
    }
  };

  const handleShare = (platform: string) => {
    const shareText = `I just got my personalized relationship advice from Obsession Trigger! Check it out:`;
    const shareUrl = window.location.href;
    
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        break;
      default:
        return;
    }
    
    window.open(shareLink, '_blank');
  };

  return (
    <Card className="bg-white rounded-xl shadow-md">
      <CardContent className="p-6 md:p-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          <span className="w-10 h-10 bg-[#fde8ef] rounded-full flex items-center justify-center">
            <CheckIcon className="text-[#f24b7c] h-5 w-5" />
          </span>
          <div className="h-1 bg-[#f24b7c] w-10"></div>
          <span className="w-10 h-10 bg-[#fde8ef] rounded-full flex items-center justify-center">
            <CheckIcon className="text-[#f24b7c] h-5 w-5" />
          </span>
          <div className="h-1 bg-[#f24b7c] w-10"></div>
          <span className="w-10 h-10 bg-[#f24b7c] rounded-full flex items-center justify-center">
            <FileTextIcon className="text-white h-5 w-5" />
          </span>
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-medium text-[#f24b7c] mb-2">
            Your Custom Obsession Trigger Plan
          </h2>
          <p className="text-gray-600 text-sm">Ready for you to download and use right away</p>
        </div>
        
        <PDFPreview
          firstName={userData.firstName}
          advice={advice}
        />
        
        <div className="flex flex-col md:flex-row gap-3 mt-4">
          <Button 
            variant="outline"
            className="flex-1 border-gray-200 hover:border-gray-300 text-gray-700 font-medium"
            onClick={handleViewPDF}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview Full PDF
          </Button>
          <Button 
            className="flex-1 bg-[#f24b7c] hover:bg-[#d22e5d] text-white font-medium"
            onClick={handleDownloadPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            Download My Plan
          </Button>
        </div>
        
        {/* Bonus gift box */}
        <div className="mt-6 p-4 bg-[#fde8ef] rounded-lg">
          <div className="flex items-center mb-1">
            <Gift className="h-5 w-5 text-[#f24b7c] mr-2" />
            <h3 className="font-medium">Free Bonus!</h3>
          </div>
          <p className="text-xs text-gray-700">
            Get <span className="font-semibold text-[#f24b7c]">3 Free Relationship Tips</span> sent to your email to help you start using these techniques right away.
          </p>
        </div>
        
        {/* Social Sharing */}
        <div className="mt-6">
          <p className="text-center text-sm text-gray-600 mb-3">Share this with someone who might need it:</p>
          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-[#3b5998] text-white hover:bg-[#3b5998]/90 border-none"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90 border-none"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-[#25D366] text-white hover:bg-[#25D366]/90 border-none"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-[#0077B5] text-white hover:bg-[#0077B5]/90 border-none"
              onClick={() => handleShare('linkedin')}
            >
              <Linkedin className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsStep;
