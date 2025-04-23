import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { signupForNewsletter } from '@/services/emailSignup';

// Form validation schema
const formSchema = z.object({
  firstName: z.string().min(2, {
    message: 'First name must be at least 2 characters',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
});

export type LeadMagnetFormData = z.infer<typeof formSchema>;

interface LeadMagnetFormProps {
  source: string;
  title?: string;
  description?: string;
  leadMagnetName?: string;
  variant?: 'sidebar' | 'inline' | 'popup';
  className?: string;
}

export default function LeadMagnetForm({
  source = 'blog-sidebar',
  title = 'Get Your Free Love Guide',
  description = 'Join thousands of women who have transformed their relationships with our expert advice.',
  leadMagnetName = 'Ultimate Relationship Guide',
  variant = 'sidebar',
  className = '',
}: LeadMagnetFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');

  const form = useForm<LeadMagnetFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      email: '',
    },
  });

  async function onSubmit(data: LeadMagnetFormData) {
    setIsSubmitting(true);
    try {
      // Call the email signup service
      const result = await signupForNewsletter({
        ...data,
        source,
        leadMagnetName,
        timestamp: new Date().toISOString(),
      });

      if (result.success) {
        setIsSuccess(true);
        setDownloadLink(result.downloadLink || '/leadmagnets/relationship-guide.pdf');
        
        toast({
          title: "Thanks for signing up!",
          description: "Your free guide is on its way to your inbox.",
        });
      } else {
        throw new Error(result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast({
        title: "Oops! Something went wrong",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // For sidebar/popup variants, we use a card with a nice background gradient
  if (variant === 'sidebar' || variant === 'popup') {
    return (
      <Card className={`overflow-hidden border-[#f24b7c]/20 ${className}`}>
        <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-[#ffedf1] to-[#f24b7c]/20 rounded-bl-full" />
        
        <CardHeader className="relative">
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-[#f24b7c] animate-pulse" fill="#f24b7c" />
            <CardTitle className="text-lg text-[#f24b7c]">{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isSuccess ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your first name" {...field} />
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
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#f24b7c] hover:bg-[#d22e5d] transition-all duration-300 shadow-md hover:shadow-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Get My Free Guide →"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="py-3">
                <Heart className="h-12 w-12 text-[#f24b7c] mx-auto mb-3" fill="#f24b7c" />
                <h3 className="font-medium text-lg">Thank you!</h3>
                <p className="text-sm text-muted-foreground">Your guide is on its way to your inbox.</p>
              </div>
              
              <Button 
                onClick={() => window.open(downloadLink, '_blank')}
                className="w-full bg-[#f24b7c] hover:bg-[#d22e5d]"
              >
                Download Now
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="px-6 py-3 bg-muted/20 text-xs text-center text-muted-foreground">
          We respect your privacy and will never share your information.
        </CardFooter>
      </Card>
    );
  }

  // For inline variant, we use a simpler form layout
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-[#f24b7c] flex items-center gap-2">
          <Heart className="h-4 w-4" fill="#f24b7c" />
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {!isSuccess ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
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
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#f24b7c] hover:bg-[#d22e5d]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Get My Free Guide →"}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="space-y-3 text-center p-3 border rounded-md bg-muted/10">
          <p className="font-medium">Thank you for signing up!</p>
          <p className="text-sm text-muted-foreground">Your guide is on its way to your inbox.</p>
          <Button 
            onClick={() => window.open(downloadLink, '_blank')}
            variant="outline"
            size="sm"
            className="border-[#f24b7c] text-[#f24b7c] hover:bg-[#ffedf1]"
          >
            Download Now
          </Button>
        </div>
      )}
    </div>
  );
}