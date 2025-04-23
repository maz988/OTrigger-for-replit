import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailFormSchema, type EmailFormData } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { CheckIcon, MailIcon, FileTextIcon, Sparkles } from 'lucide-react';

interface EmailCollectionStepProps {
  onSubmit: (data: EmailFormData) => void;
}

const EmailCollectionStep: React.FC<EmailCollectionStepProps> = ({ onSubmit }) => {
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      firstName: '',
      email: '',
    },
  });

  const handleSubmit = (data: EmailFormData) => {
    // For demo purposes, just submit with current form data
    onSubmit(data);
  };

  return (
    <Card className="bg-white rounded-xl shadow-md">
      <CardContent className="p-6 md:p-8 relative z-10">
        <div className="flex items-center justify-center mb-6">
          <span className="w-10 h-10 bg-[#fde8ef] rounded-full flex items-center justify-center">
            <CheckIcon className="text-[#f24b7c] h-5 w-5" />
          </span>
          <div className="h-1 bg-[#f24b7c] w-10"></div>
          <span className="w-10 h-10 bg-[#f24b7c] rounded-full flex items-center justify-center">
            <MailIcon className="text-white h-5 w-5" />
          </span>
          <div className="h-1 bg-gray-200 w-10"></div>
          <span className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <FileTextIcon className="text-gray-400 h-5 w-5" />
          </span>
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-medium text-[#f24b7c] mb-2">
            Your advice is ready!
          </h2>
          <p className="text-gray-600 text-center max-w-md mx-auto mb-6 text-sm">
            Enter your details below to get your personalized "Obsession Trigger Plan" delivered to your inbox.
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-w-md mx-auto">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Your First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your first name"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-[#f24b7c] focus:border-[#f24b7c]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-[#f24b7c] focus:border-[#f24b7c]"
                      {...field}
                    />
                  </FormControl>
                  <p className="mt-1 text-xs text-gray-500">We'll send your personalized advice to this email</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <Button 
                type="submit"
                className="w-full bg-[#f24b7c] hover:bg-[#d22e5d] text-white font-medium py-3 px-6 rounded-full transition-colors"
              >
                Get My Personalized Plan
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center pt-2">
              By continuing, you agree to receive relationship advice emails. You can unsubscribe at any time.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EmailCollectionStep;
