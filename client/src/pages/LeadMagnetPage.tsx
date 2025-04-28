import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface LeadMagnetData {
  firstName: string;
  email: string;
}

const LeadMagnetPage: React.FC = () => {
  const [formData, setFormData] = useState<LeadMagnetData>({
    firstName: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiRequest('POST', '/api/leads/subscribe', {
        firstName: formData.firstName,
        email: formData.email,
        source: 'obsession-lead-magnet',
        leadMagnet: 'hero-instinct-phrases'
      });

      if (response.status === 200 || response.status === 201) {
        setSubmitted(true);
        toast({
          title: "Success!",
          description: "Check your inbox! Your guide is on the way.",
          variant: "default",
        });
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Current date for schema
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Schema markup for SEO
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "headline": "How to Make a Man Obsessed With You",
    "description": "Learn simple psychological secrets to emotionally connect with him deeply. Free download available now.",
    "image": "https://yourdomain.com/images/make-him-obsessed.jpg",
    "url": "https://yourdomain.com/how-to-make-a-man-obsessed-with-you",
    "author": {
      "@type": "Organization",
      "name": "Obsession Trigger"
    },
    "datePublished": currentDate
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Helmet>
        <title>How to Make a Man Obsessed With You — Free Step-by-Step Guide</title>
        <meta name="description" content="Discover simple psychological secrets to make him crave you emotionally and stay deeply connected — Download your free guide today!" />
        <meta property="og:title" content="How to Make a Man Obsessed With You — Free Step-by-Step Guide" />
        <meta property="og:description" content="Discover simple psychological secrets to make him crave you emotionally and stay deeply connected — Download your free guide today!" />
        <meta property="og:image" content="https://yourdomain.com/images/make-him-obsessed.jpg" />
        <meta property="og:url" content="https://yourdomain.com/how-to-make-a-man-obsessed-with-you" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://yourdomain.com/how-to-make-a-man-obsessed-with-you" />
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            How to Make a Man Obsessed With You <br />
            <span className="text-2xl md:text-3xl text-primary/80">(The Hidden Secrets Revealed)</span>
          </h1>
          
          <div className="prose prose-lg mx-auto mt-8 text-left">
            <p className="text-xl">
              Have you ever wished he would chase you, think about you nonstop, and see you as "the one he can't live without"?
              <br /><br />
              You're not alone.
              <br /><br />
              The truth is, obsession isn't about playing games — it's about triggering natural emotional responses inside his mind.
              <br /><br />
              Today, I'm going to show you exactly how to make a man obsessed with you — using simple, proven psychological principles.
            </p>
            
            <div className="my-8 p-4 border-l-4 border-primary bg-primary/5 text-lg">
              👉 Plus, you'll get instant access to my free guide: <strong>"7 Secret Phrases That Trigger His Hero Instinct"</strong> — the fastest way to connect deeply with his heart.
            </div>
          </div>
        </header>
        
        <main>
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-primary">Why Men Become Emotionally Obsessed (Science Explains)</h2>
            <div className="prose prose-lg max-w-none">
              <p>
                Many women mistakenly believe looks or "chasing" will make a man obsessed.
                <br /><br />
                In reality, <a href="https://www.psychologytoday.com/us/blog/the-attraction-doctor/201707/why-men-fall-in-love-which-men-and-why" target="_blank" rel="noopener noreferrer" className="text-primary underline">studies show</a> emotional triggers — not appearance — cause lasting attraction.
                <br /><br />
                When you activate his <strong>hero instinct</strong>, he feels needed, respected, and deeply connected.
              </p>
              
              <ul className="my-6">
                <li>✅ It's not manipulation.</li>
                <li>✅ It's about speaking to his natural masculine wiring.</li>
              </ul>
            </div>
            
            <div className="my-8">
              <img 
                src="/images/man-emotional-connection.jpg" 
                alt="Emotional guide to make a man obsessed with you" 
                className="rounded-lg shadow-md w-full max-w-2xl mx-auto"
              />
            </div>
          </section>
          
          <section className="mb-16 bg-muted/50 p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-6 text-primary">What You'll Discover Inside the Free Guide</h2>
            <div className="prose prose-lg max-w-none">
              <p>Inside this free guide, you'll learn:</p>
              <ul className="my-6 space-y-3">
                <li>✨ The <strong>one sentence</strong> that instantly grabs his deep attention</li>
                <li>✨ How to make him <strong>chase you without playing hard to get</strong></li>
                <li>✨ The real reason <strong>men pull away</strong> — and how to reverse it</li>
                <li>✨ How to <strong>spark emotional desire</strong> that lasts</li>
              </ul>
            </div>
          </section>
          
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-primary">How to Get Your Free Guide</h2>
            <div className="prose prose-lg max-w-none mb-8">
              <p>
                Getting access is simple — and 100% free.
                <br /><br />
                Just enter your name and best email below, and I'll send you the guide instantly.
              </p>
              <p className="font-medium">(And yes, it's packed with tips you can start using <strong>tonight</strong>.)</p>
            </div>
            
            {!submitted ? (
              <div className="bg-white p-6 rounded-xl shadow-md max-w-md mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      First Name
                    </label>
                    <Input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      placeholder="Your first name"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Your best email"
                      className="w-full"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Me The Free Guide"
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl shadow-md max-w-md mx-auto text-center">
                <h3 className="text-xl font-bold text-green-800 mb-2">Check Your Inbox!</h3>
                <p className="text-green-700">Your guide is on the way. Please check your email in the next few minutes.</p>
              </div>
            )}
          </section>
        </main>
        
        <footer className="mt-12 pt-8 border-t border-muted-foreground/20">
          <div className="flex flex-col md:flex-row justify-center gap-8 text-center md:text-left">
            <Link href="/" className="text-primary hover:underline">
              Discover More Relationship Secrets
            </Link>
            <Link href="/blog" className="text-primary hover:underline">
              Read Our Latest Love Advice Articles
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LeadMagnetPage;