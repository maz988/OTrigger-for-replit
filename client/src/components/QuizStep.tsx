import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  RadioGroup, 
  RadioGroupItem 
} from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { type QuizFormData } from '@shared/schema';
import { ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';

interface QuizStepProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const QuizStep: React.FC<QuizStepProps> = ({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSubmit,
}) => {
  const { control } = useFormContext<QuizFormData>();
  
  // Quiz content based on step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <h2 className="text-2xl md:text-3xl font-poppins font-semibold mb-6 text-center">Let's get to know you better</h2>
            <p className="text-neutral-600 mb-8 text-center">Answer 5 quick questions to receive personalized relationship advice</p>
            
            <div className="mb-8">
              <FormField
                control={control}
                name="relationshipStatus"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-lg md:text-xl font-medium">What's your relationship status?</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value}
                        className="space-y-3"
                      >
                        {[
                          { value: "Single", label: "Single but interested in someone" },
                          { value: "Dating", label: "Dating but not committed" },
                          { value: "Relationship", label: "In a relationship" },
                          { value: "Married", label: "Married" },
                          { value: "Complicated", label: "It's complicated" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center p-4 border border-neutral-200 rounded-lg cursor-pointer hover:border-primary-200 transition-colors"
                          >
                            <RadioGroupItem 
                              value={option.value} 
                              id={option.value}
                              className="text-primary-500 focus:ring-primary-500 h-5 w-5"
                            />
                            <span className="ml-3">{option.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );
      
      case 2:
        return (
          <>
            <h2 className="text-2xl md:text-3xl font-poppins font-semibold mb-6">What's your biggest concern?</h2>
            
            <div className="mb-8">
              <FormField
                control={control}
                name="concernType"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-lg md:text-xl font-medium">What's your biggest concern in the relationship?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3"
                      >
                        {[
                          { value: "Communication", label: "Lack of communication" },
                          { value: "Commitment", label: "Commitment issues" },
                          { value: "Affection", label: "Lack of affection/romance" },
                          { value: "Trust", label: "Trust issues" },
                          { value: "Other", label: "Other" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center p-4 border border-neutral-200 rounded-lg cursor-pointer hover:border-primary-200 transition-colors"
                          >
                            <RadioGroupItem 
                              value={option.value} 
                              id={option.value}
                              className="text-primary-500 focus:ring-primary-500 h-5 w-5"
                            />
                            <span className="ml-3">{option.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );
      
      case 3:
        return (
          <>
            <h2 className="text-2xl md:text-3xl font-poppins font-semibold mb-6">Understanding his behavior</h2>
            
            <div className="mb-8">
              <FormField
                control={control}
                name="confusingBehavior"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-lg md:text-xl font-medium">What's something he does that confuses you?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe a behavior that leaves you confused or frustrated..."
                        className="w-full p-4 border border-neutral-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 resize-none h-32"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-neutral-500">Feel free to share as much detail as you're comfortable with</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );
      
      case 4:
        return (
          <>
            <h2 className="text-2xl md:text-3xl font-poppins font-semibold mb-6">Your communication style</h2>
            
            <div className="mb-8">
              <FormField
                control={control}
                name="communicationStyle"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-lg md:text-xl font-medium">How do you typically communicate with him?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3"
                      >
                        {[
                          { value: "Direct", label: "Direct and to the point" },
                          { value: "Emotional", label: "Emotional and expressive" },
                          { value: "Passive", label: "Passive, I often hold back" },
                          { value: "Mixed", label: "It depends on the situation" },
                          { value: "Avoidant", label: "I avoid difficult conversations" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center p-4 border border-neutral-200 rounded-lg cursor-pointer hover:border-primary-200 transition-colors"
                          >
                            <RadioGroupItem 
                              value={option.value} 
                              id={option.value}
                              className="text-primary-500 focus:ring-primary-500 h-5 w-5"
                            />
                            <span className="ml-3">{option.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );
      
      case 5:
        return (
          <>
            <h2 className="text-2xl md:text-3xl font-poppins font-semibold mb-6">Your relationship goals</h2>
            
            <div className="mb-8">
              <FormField
                control={control}
                name="desiredOutcome"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-lg md:text-xl font-medium">What's your desired outcome for this relationship?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3"
                      >
                        {[
                          { value: "Commitment", label: "Long-term commitment/marriage" },
                          { value: "Improvement", label: "Improving our existing relationship" },
                          { value: "Attention", label: "Getting his attention and interest" },
                          { value: "Understanding", label: "Understanding him better" },
                          { value: "Closure", label: "Finding closure or moving on" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center p-4 border border-neutral-200 rounded-lg cursor-pointer hover:border-primary-200 transition-colors"
                          >
                            <RadioGroupItem 
                              value={option.value} 
                              id={option.value}
                              className="text-primary-500 focus:ring-primary-500 h-5 w-5"
                            />
                            <span className="ml-3">{option.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-pink-100 transition-all duration-300 card-transition">
      <CardContent className="p-6 md:p-8">
        <div className="quiz-fade-enter quiz-fade-enter-active">
          {renderStepContent()}
        </div>
        
        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <Button
              variant="outline" 
              onClick={onPrev}
              className="border border-blue-200 hover:border-blue-300 text-blue-600 font-medium shadow-sm hover:shadow transition-all duration-200"
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
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={onSubmit}
              className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
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
