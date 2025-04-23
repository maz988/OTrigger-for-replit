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
  MessageCircle 
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
    const shareText = `I just got my personalized relationship advice from Obsession Trigger AI! Check it out:`;
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
    <Card className="bg-white rounded-xl shadow-card">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center justify-center mb-6">
          <span className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <CheckIcon className="text-primary-500 h-5 w-5" />
          </span>
          <div className="h-px bg-primary-100 w-12"></div>
          <span className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <CheckIcon className="text-primary-500 h-5 w-5" />
          </span>
          <div className="h-px bg-primary-100 w-12"></div>
          <span className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <FileTextIcon className="text-primary-500 h-5 w-5" />
          </span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-poppins font-semibold mb-4 text-center">Your Custom Obsession Trigger Plan</h2>
        
        <PDFPreview
          firstName={userData.firstName}
          advice={advice}
        />
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <Button 
            variant="secondary"
            className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white font-medium"
            onClick={handleViewPDF}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Full PDF
          </Button>
          <Button 
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium"
            onClick={handleDownloadPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
        
        {/* Social Sharing */}
        <div className="mt-8">
          <p className="text-center text-sm font-medium text-neutral-600 mb-3">Share this with someone who might need it:</p>
          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-[#3b5998] text-white hover:bg-[#3b5998]/90"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-[#25D366] text-white hover:bg-[#25D366]/90"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-[#0077B5] text-white hover:bg-[#0077B5]/90"
              onClick={() => handleShare('linkedin')}
            >
              <Linkedin className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsStep;
