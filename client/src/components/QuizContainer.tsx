import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quizFormSchema, emailFormSchema, type QuizFormData, type EmailFormData } from '@shared/schema';
import QuizStep from './QuizStep';
import LoadingStep from './LoadingStep';
import EmailCollectionStep from './EmailCollectionStep';
import ResultsStep from './ResultsStep';
import { generateAdvice } from '@/lib/openai';
import { saveQuizResponse } from '@/lib/firebase';
import { generatePDF } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';
import { parseTrackingParams, type ReferralSource } from '@shared/blog-integration';
import { trackQuizLeadConversion } from '@/services/emailSignup';

const QuizContainer: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailStep, setShowEmailStep] = useState(false);
  const [showResultsStep, setShowResultsStep] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [userData, setUserData] = useState<EmailFormData | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [referralData, setReferralData] = useState<ReferralSource | null>(null);
  const { toast } = useToast();
  const totalSteps = 5;
  
  // Track referral source on component mount
  useEffect(() => {
    try {
      const currentUrl = window.location.href;
      const referralSource = parseTrackingParams(currentUrl);
      
      if (referralSource) {
        setReferralData(referralSource);
        console.log('User referred from:', referralSource);
        
        // If user came from the blog, we can personalize their experience
        if (referralSource.source === 'blog' && referralSource.keyword) {
          // This could be used to adapt the quiz based on what content they were reading
          console.log(`User was reading about: ${referralSource.keyword}`);
          
          // If this was a blog post about a specific relationship topic,
          // we could potentially pre-select some quiz options that are relevant
          if (referralSource.keyword.includes('hero instinct')) {
            // For example, customize the default form values related to this topic
          }
        }
      }
    } catch (error) {
      console.error('Error parsing referral data:', error);
    }
  }, []);

  const methods = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      relationshipStatus: 'Dating',
      concernType: 'Commitment',
      confusingBehavior: "He's hot and cold with me. One day he seems really interested, texting me all day, and the next day he barely responds.",
      communicationStyle: 'Emotional',
      desiredOutcome: 'Attention',
    },
    mode: 'onChange', // In a real app this would be 'onBlur' or 'onSubmit'
  });

  const handlePrevStep = () => {
    if (currentStep > 1) {
      console.log('Moving from step', currentStep, 'to step', currentStep - 1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    // For demonstration purposes, skip validation to make UI functional
    // In a production app, we'd validate properly
    console.log('Current form values:', methods.getValues());
    
    if (currentStep < totalSteps) {
      console.log('Moving from step', currentStep, 'to step', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the quiz
      handleQuizSubmit();
    }
  };

  const handleQuizSubmit = async () => {
    try {
      setIsLoading(true);
      const quizData = methods.getValues();
      
      // Generate AI advice
      const advice = await generateAdvice(quizData);
      setAiAdvice(advice);
      
      // Show email collection step
      setIsLoading(false);
      setShowEmailStep(true);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "There was an error generating your advice. Please try again.",
        variant: "destructive",
      });
      console.error("Error submitting quiz:", error);
    }
  };

  const handleEmailSubmit = async (data: EmailFormData) => {
    try {
      setUserData(data);
      const quizData = methods.getValues();
      
      // Add referral data to the saved information if available
      const enhancedData = {
        ...data,
        referralSource: referralData?.source || 'direct',
        referralCampaign: referralData?.campaign,
        referralKeyword: referralData?.keyword,
        referralContent: referralData?.content,
        blogPost: referralData?.blogPost
      };
      
      // Save to Firebase with referral data
      const saveResponse = await saveQuizResponse(
        { ...quizData, ...enhancedData },
        aiAdvice
      );
      
      // Send the quiz lead to the email subscription endpoint for proper subscription
      if (saveResponse.success && saveResponse.id) {
        console.log('Sending user data to quiz lead conversion endpoint...');
        try {
          // Pass the quiz response ID and user data to the email service
          await trackQuizLeadConversion(
            parseInt(saveResponse.id.toString().replace('mock-id-', '')),
            data.email,
            data.firstName,
            data.lastName || undefined
          );
          console.log('Quiz subscriber data sent to email service successfully');
        } catch (subscribeError) {
          console.error('Failed to send quiz subscriber to email service', subscribeError);
          // Continue processing even if email service fails
        }
      }
      
      // Generate PDF 
      const affiliateLink = "https://hop.clickbank.net/?affiliate=yourID&vendor=hissecobs";
      const pdf = generatePDF({
        quizData,
        userData: enhancedData,
        advice: aiAdvice,
        affiliateLink,
      });
      
      setPdfDocument(pdf);
      setShowEmailStep(false);
      setShowResultsStep(true);
      
      toast({
        title: "Success!",
        description: "Your personalized advice is ready.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error saving your information. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving email:", error);
    }
  };

  const currentPercent = Math.min(((currentStep - 1) / totalSteps) * 100, 100);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:max-w-4xl">
      {/* Progress bar - only show for quiz steps */}
      {!isLoading && !showEmailStep && !showResultsStep && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-neutral-500 font-medium">
              Question {currentStep} of {totalSteps}
            </span>
            <span className="text-xs text-neutral-500 font-medium">
              <span className="text-primary-500 font-medium">{Math.round(currentPercent)}%</span> Complete
            </span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1">
            <div 
              className="progress-bar bg-primary-400 rounded-full" 
              style={{ width: `${currentPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Quiz Steps Container */}
      <FormProvider {...methods}>
        <div className="relative">
          {!isLoading && !showEmailStep && !showResultsStep && (
            <QuizStep
              currentStep={currentStep}
              onPrev={handlePrevStep}
              onNext={handleNextStep}
              onSubmit={handleQuizSubmit}
              totalSteps={totalSteps}
            />
          )}

          {isLoading && <LoadingStep />}

          {showEmailStep && (
            <EmailCollectionStep onSubmit={handleEmailSubmit} />
          )}

          {showResultsStep && userData && (
            <ResultsStep 
              advice={aiAdvice}
              userData={userData}
              pdfDocument={pdfDocument}
            />
          )}
        </div>
      </FormProvider>
    </div>
  );
};

export default QuizContainer;
