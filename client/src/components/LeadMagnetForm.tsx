import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailFormSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { submitLeadData, generateAndSendLeadMagnet } from '@/services/emailSignup';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Extend the email form schema to add validation
const leadMagnetFormSchema = emailFormSchema.extend({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

type LeadMagnetFormData = z.infer<typeof leadMagnetFormSchema>;

interface LeadMagnetFormProps {
  source?: string;
  title?: string;
  description?: string;
  leadMagnetName?: string;
  variant?: 'sidebar' | 'inline' | 'popup';
  onSuccess?: (data: LeadMagnetFormData) => void;
}

export default function LeadMagnetForm({
  source = 'website',
  title = 'Get Your Free Guide',
  description = 'Enter your details below to receive your free relationship guide.',
  leadMagnetName = 'Relationship Guide',
  variant = 'inline',
  onSuccess
}: LeadMagnetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { settings } = useSettings();
  
  const form = useForm<LeadMagnetFormData>({
    resolver: zodResolver(leadMagnetFormSchema),
    defaultValues: {
      firstName: '',
      email: '',
    },
  });

  const handleSubmit = async (data: LeadMagnetFormData) => {
    setIsSubmitting(true);
    
    try {
      // Submit lead data
      await submitLeadData({
        ...data,
        source,
        leadMagnetName,
      });
      
      // Generate and send lead magnet
      await generateAndSendLeadMagnet(
        data.email,
        data.firstName,
        leadMagnetName
      );
      
      setIsSuccess(true);
      
      toast({
        title: "Success!",
        description: `We've sent the ${leadMagnetName} to your email.`,
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Lead magnet form submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem sending your guide. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Different styling based on variant
  const getContainerClasses = () => {
    switch (variant) {
      case 'sidebar':
        return 'bg-[#ffedf1] rounded-md p-4';
      case 'popup':
        return 'bg-white p-6 rounded-lg shadow-lg max-w-md w-full';
      case 'inline':
      default:
        return '';
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className={getContainerClasses()}>
        <div className="text-center py-4">
          <div className="flex flex-col items-center mb-3">
            {variant === 'sidebar' && (
              <img 
                src={settings.pdfGuideImageUrl} 
                alt="Relationship Guide PDF" 
                className="w-16 h-24 mb-3 drop-shadow-md" 
                onError={(e) => {
                  e.currentTarget.src = '/images/pdf-guide-icon.svg';
                }}
              />
            )}
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Thank You!</h3>
          <p className="text-gray-600">
            Check your email for your {leadMagnetName}. If you don't see it, please check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  // For sidebar variant, use a simpler form
  if (variant === 'sidebar') {
    return (
      <div className={getContainerClasses()}>
        <div className="flex flex-col items-center mb-4">
          <img 
            src={settings.pdfGuideImageUrl} 
            alt="Relationship Guide PDF" 
            className="w-20 h-28 mb-2 drop-shadow-md"
            onError={(e) => {
              e.currentTarget.src = '/images/pdf-guide-icon.svg';
            }}
          />
          <h3 className="text-lg font-semibold text-[#f24b7c] mb-1">{title}</h3>
          <p className="text-sm text-gray-600 text-center">{description}</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="First Name" 
                      {...field} 
                      className="border-gray-300"
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
                  <FormControl>
                    <Input 
                      placeholder="Email Address" 
                      type="email" 
                      {...field} 
                      className="border-gray-300"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-[#f24b7c] hover:bg-[#d22e5d]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Get Free Guide'
              )}
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  // Default form (inline or popup)
  return (
    <Card className={`${getContainerClasses()} border-[#f24b7c]/20`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-[#f24b7c]">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="border-gray-300" />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} className="border-gray-300" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-[#f24b7c] hover:bg-[#d22e5d]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Get Your Free Guide'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}