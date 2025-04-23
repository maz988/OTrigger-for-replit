import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { 
  FormField, 
  FormItem, 
  FormControl,
  FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { type QuizFormData } from '@shared/schema';
import { ChevronLeft, Wand2, Heart } from 'lucide-react';

interface QuizStepProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

// These are the options for each step
const STEP_OPTIONS = {
  relationshipStatus: [
    { value: "Single", label: "Single" },
    { value: "Dating", label: "Dating" },
    { value: "Relationship", label: "In a relationship" },
    { value: "Complicated", label: "It's complicated" },
  ],
  concernType: [
    { value: "Communication", label: "Lack of communication" },
    { value: "Commitment", label: "Commitment issues" },
    { value: "Affection", label: "Lack of affection/romance" },
    { value: "Trust", label: "Trust issues" },
    { value: "Other", label: "Other" },
  ],
  communicationStyle: [
    { value: "Direct", label: "Direct and to the point" },
    { value: "Emotional", label: "Emotional and expressive" },
    { value: "Passive", label: "Passive, I often hold back" },
    { value: "Mixed", label: "It depends on the situation" },
    { value: "Avoidant", label: "I avoid difficult conversations" },
  ],
  desiredOutcome: [
    { value: "Commitment", label: "Long-term commitment/marriage" },
    { value: "Improvement", label: "Improving our existing relationship" },
    { value: "Attention", label: "Getting his attention and interest" },
    { value: "Understanding", label: "Understanding him better" },
    { value: "Closure", label: "Finding closure or moving on" },
  ],
};

// Custom radio option component
const RadioOption = ({ 
  value, 
  label, 
  isSelected, 
  onClick 
}: { 
  value: string; 
  label: string; 
  isSelected: boolean; 
  onClick: () => void 
}) => (
  <div
    className={`flex items-center p-3 border rounded-lg cursor-pointer hover:border-pink-200 transition-colors ${
      isSelected ? 'border-[#f24b7c] bg-[#fdf2f5]' : 'border-gray-200'
    }`}
    onClick={onClick}
  >
    <div 
      className={`w-4 h-4 rounded-full mr-3 ${
        isSelected ? 'bg-[#f24b7c]' : 'border border-gray-300'
      }`} 
    />
    <span>{label}</span>
  </div>
);

const QuizStep: React.FC<QuizStepProps> = ({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSubmit,
}) => {
  const { control, setValue, watch } = useFormContext<QuizFormData>();
  
  // Step 1: Relationship Status
  const renderStep1 = () => {
    const value = watch('relationshipStatus');
    return (
      <>
        <div className="flex justify-center mb-4">
          <Heart className="text-[#f24b7c] h-6 w-6" />
        </div>
        
        <h2 className="text-xl text-center font-medium mb-6">What's your current relationship status?</h2>
        
        <div className="mb-4 space-y-2">
          {STEP_OPTIONS.relationshipStatus.map(option => (
            <RadioOption
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={value === option.value}
              onClick={() => setValue('relationshipStatus', option.value)}
            />
          ))}
        </div>
      </>
    );
  };

  // Step 2: Concern Type
  const renderStep2 = () => {
    const value = watch('concernType');
    return (
      <>
        <div className="flex justify-center mb-4">
          <Heart className="text-[#f24b7c] h-6 w-6" />
        </div>
        
        <h2 className="text-xl text-center font-medium mb-6">What's your biggest concern?</h2>
        
        <div className="mb-4 space-y-2">
          {STEP_OPTIONS.concernType.map(option => (
            <RadioOption
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={value === option.value}
              onClick={() => setValue('concernType', option.value)}
            />
          ))}
        </div>
      </>
    );
  };

  // Step 3: Confusing Behavior
  const renderStep3 = () => {
    return (
      <>
        <div className="flex justify-center mb-4">
          <Heart className="text-[#f24b7c] h-6 w-6" />
        </div>
        
        <h2 className="text-xl text-center font-medium mb-6">What confuses you about his behavior?</h2>
        
        <div className="mb-4">
          <FormField
            control={control}
            name="confusingBehavior"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormControl>
                  <Textarea
                    placeholder="Describe a behavior that leaves you confused or frustrated..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-[#f24b7c] focus:border-[#f24b7c] resize-none h-24"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-gray-500">Your answer helps us provide personalized advice</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </>
    );
  };

  // Step 4: Communication Style
  const renderStep4 = () => {
    const value = watch('communicationStyle');
    return (
      <>
        <div className="flex justify-center mb-4">
          <Heart className="text-[#f24b7c] h-6 w-6" />
        </div>
        
        <h2 className="text-xl text-center font-medium mb-6">How do you typically communicate with him?</h2>
        
        <div className="mb-4 space-y-2">
          {STEP_OPTIONS.communicationStyle.map(option => (
            <RadioOption
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={value === option.value}
              onClick={() => setValue('communicationStyle', option.value)}
            />
          ))}
        </div>
      </>
    );
  };

  // Step 5: Desired Outcome
  const renderStep5 = () => {
    const value = watch('desiredOutcome');
    return (
      <>
        <div className="flex justify-center mb-4">
          <Heart className="text-[#f24b7c] h-6 w-6" />
        </div>
        
        <h2 className="text-xl text-center font-medium mb-6">What's your desired outcome?</h2>
        
        <div className="mb-4 space-y-2">
          {STEP_OPTIONS.desiredOutcome.map(option => (
            <RadioOption
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={value === option.value}
              onClick={() => setValue('desiredOutcome', option.value)}
            />
          ))}
        </div>
      </>
    );
  };
  
  // Render the appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };
  
  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="w-full mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(((currentStep - 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full">
            <div 
              className="h-2 bg-[#f24b7c] rounded-full" 
              style={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          {renderStepContent()}
        </div>
        
        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <Button
              variant="outline" 
              onClick={onPrev}
              className="border-gray-200 hover:border-gray-300 text-gray-700 font-medium"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div></div> // Empty div to maintain flex spacing
          )}
          
          {currentStep < totalSteps ? (
            <Button 
              onClick={onNext}
              className="bg-[#f24b7c] hover:bg-[#d22e5d] text-white font-medium w-full max-w-xs rounded-full"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={onSubmit}
              className="bg-[#f24b7c] hover:bg-[#d22e5d] text-white font-medium w-full max-w-xs rounded-full"
            >
              Generate My Advice
              <Wand2 className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizStep;