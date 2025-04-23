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
    <Card className="bg-white rounded-2xl shadow-lg border border-pink-100 transition-all duration-300 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-100 rounded-full opacity-20 blur-2xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-100 rounded-full opacity-20 blur-2xl"></div>
      
      <CardContent className="p-6 md:p-8 relative z-10">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <span className="w-12 h-12 bg-gradient-to-r from-pink-100 to-pink-200 rounded-full flex items-center justify-center shadow-sm">
            <CheckIcon className="text-pink-600 h-6 w-6" />
          </span>
          <div className="h-1 bg-gradient-to-r from-pink-200 to-blue-200 w-12"></div>
          <span className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
            <CheckIcon className="text-blue-600 h-6 w-6" />
          </span>
          <div className="h-1 bg-gradient-to-r from-blue-200 to-pink-200 w-12"></div>
          <span className="w-12 h-12 bg-gradient-to-r from-pink-200 to-pink-300 rounded-full flex items-center justify-center shadow-sm">
            <FileTextIcon className="text-pink-600 h-6 w-6" />
          </span>
        </div>
        
        <div className="text-center mb-6">
          <Sparkles className="inline-block h-5 w-5 text-pink-500 mb-2" />
          <h2 className="text-2xl md:text-3xl font-poppins font-semibold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Your Custom Obsession Trigger Plan
          </h2>
          <p className="text-neutral-600 mt-2">Ready for you to download and use right away</p>
        </div>
        
        <PDFPreview
          firstName={userData.firstName}
          advice={advice}
        />
        
        <div className="flex flex-col md:flex-row gap-4">
          <Button 
            variant="outline"
            className="flex-1 border-blue-200 hover:border-blue-300 text-blue-600 font-medium shadow hover:shadow-md transition-all duration-200"
            onClick={handleViewPDF}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview Full PDF
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            onClick={handleDownloadPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            Download My Plan
          </Button>
        </div>
        
        {/* Bonus gift box */}
        <div className="mt-8 p-5 bg-gradient-to-r from-pink-50 to-blue-50 rounded-xl border border-pink-100">
          <div className="flex items-center mb-2">
            <Gift className="h-5 w-5 text-pink-500 mr-2" />
            <h3 className="font-medium text-lg">Free Bonus!</h3>
          </div>
          <p className="text-sm text-neutral-700">
            Get <span className="font-semibold text-pink-600">3 Free Relationship Tips</span> sent to your email to help you start using these techniques right away.
          </p>
        </div>
        
        {/* Social Sharing */}
        <div className="mt-8">
          <p className="text-center text-sm font-medium text-neutral-600 mb-4">Share this with someone who might need it:</p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              className="w-11 h-11 rounded-full bg-[#3b5998] text-white hover:bg-[#3b5998]/90 border-none shadow hover:shadow-md transition-all duration-200"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-11 h-11 rounded-full bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90 border-none shadow hover:shadow-md transition-all duration-200"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-11 h-11 rounded-full bg-[#25D366] text-white hover:bg-[#25D366]/90 border-none shadow hover:shadow-md transition-all duration-200"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-11 h-11 rounded-full bg-[#0077B5] text-white hover:bg-[#0077B5]/90 border-none shadow hover:shadow-md transition-all duration-200"
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
