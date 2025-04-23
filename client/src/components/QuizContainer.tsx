import React, { useState } from 'react';
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

const QuizContainer: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailStep, setShowEmailStep] = useState(false);
  const [showResultsStep, setShowResultsStep] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [userData, setUserData] = useState<EmailFormData | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const { toast } = useToast();
  const totalSteps = 5;

  const methods = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      relationshipStatus: '',
      concernType: '',
      confusingBehavior: '',
      communicationStyle: '',
      desiredOutcome: '',
    },
    mode: 'onChange',
  });

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = async () => {
    const isValid = await methods.trigger();
    if (!isValid) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the quiz
      await handleQuizSubmit();
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
      
      // Save to Firebase
      await saveQuizResponse(
        { ...quizData, ...data },
        aiAdvice
      );
      
      // Generate PDF
      const affiliateLink = "https://hop.clickbank.net/?affiliate=yourID&vendor=hissecobs";
      const pdf = generatePDF({
        quizData,
        userData: data,
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
