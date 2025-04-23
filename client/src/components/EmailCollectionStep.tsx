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
import { CheckIcon, MailIcon, FileTextIcon } from 'lucide-react';

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
    <Card className="bg-white rounded-xl shadow-card">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center justify-center mb-6">
          <span className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <CheckIcon className="text-primary-500 h-5 w-5" />
          </span>
          <div className="h-px bg-primary-100 w-12"></div>
          <span className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <MailIcon className="text-primary-500 h-5 w-5" />
          </span>
          <div className="h-px bg-neutral-200 w-12"></div>
          <span className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
            <FileTextIcon className="text-neutral-400 h-5 w-5" />
          </span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-poppins font-semibold mb-3 text-center">Your advice is ready!</h2>
        <p className="text-neutral-600 text-center max-w-md mx-auto mb-8">
          Enter your details below to get your personalized "Obsession Trigger Plan" delivered to your inbox.
        </p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-w-md mx-auto">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-700">Your First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your first name"
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-sm"
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
