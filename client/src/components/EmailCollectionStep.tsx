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
    onSubmit(data);
  };

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-pink-100 transition-all duration-300 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-100 rounded-full opacity-20 blur-2xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-100 rounded-full opacity-20 blur-2xl"></div>
      
      <CardContent className="p-6 md:p-8 relative z-10">
        <div className="flex items-center justify-center mb-8">
          <span className="w-12 h-12 bg-gradient-to-r from-pink-100 to-pink-200 rounded-full flex items-center justify-center shadow-sm">
            <CheckIcon className="text-pink-600 h-6 w-6" />
          </span>
          <div className="h-1 bg-gradient-to-r from-pink-200 to-blue-200 w-12"></div>
          <span className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
            <MailIcon className="text-blue-600 h-6 w-6" />
          </span>
          <div className="h-1 bg-neutral-200 w-12"></div>
          <span className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center shadow-sm">
            <FileTextIcon className="text-neutral-400 h-6 w-6" />
          </span>
        </div>
        
        <div className="text-center mb-6">
          <Sparkles className="inline-block h-5 w-5 text-pink-500 mb-2" />
          <h2 className="text-2xl md:text-3xl font-poppins font-semibold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Your advice is ready!
          </h2>
          <p className="text-neutral-600 text-center max-w-md mx-auto mt-2 mb-6">
            Enter your details below to get your personalized "Obsession Trigger Plan" delivered to your inbox.
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 max-w-md mx-auto">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-700">Your First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your first name"
                      className="w-full p-3 border border-blue-200 rounded-lg focus:ring-pink-500 focus:border-pink-500 shadow-sm"
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
                  <FormLabel className="text-sm font-medium text-neutral-700">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      className="w-full p-3 border border-blue-200 rounded-lg focus:ring-pink-500 focus:border-pink-500 shadow-sm"
                      {...field}
                    />
                  </FormControl>
                  <p className="mt-1 text-xs text-neutral-500">We'll send your personalized advice to this email</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Get My Personalized Plan
              </Button>
            </div>
            
            <p className="text-xs text-neutral-500 text-center pt-2">
              By continuing, you agree to receive relationship advice emails. You can unsubscribe at any time.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EmailCollectionStep;
