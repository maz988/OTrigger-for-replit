import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Separator } from '@/components/ui/separator';

const PrivacyPolicy = () => {
  // Scroll to top on component mount
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Privacy Policy</h1>
        <Separator className="mb-8" />
        
        <div className="prose max-w-none dark:prose-invert">
          <p className="text-lg mb-4">Last Updated: April 25, 2025</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p>
              Welcome to Obsession Trigger AI ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using our website and services, you acknowledge that you have read, understood, and agree to be bound by all the terms outlined in this Privacy Policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <h3 className="text-xl font-medium mt-4 mb-2">Personal Information</h3>
            <p>
              When you use our services, we may ask for personal information such as:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Relationship status</li>
              <li>Information about your personal relationships</li>
              <li>Responses to our relationship assessment quiz</li>
            </ul>
            <h3 className="text-xl font-medium mt-4 mb-2">Usage Information</h3>
            <p>
              We automatically collect certain information about your device and how you interact with our website, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Referral source</li>
              <li>Length of visit and pages viewed</li>
              <li>Navigation paths</li>
              <li>Information about the timing, frequency, and pattern of your service use</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p>We may use the information we collect for various purposes, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Providing, personalizing, and improving our services</li>
              <li>Generating personalized relationship advice and reports</li>
              <li>Processing your quiz responses to deliver relevant content</li>
              <li>Sending you promotional materials and newsletters</li>
              <li>Responding to your comments, questions, and requests</li>
              <li>Monitoring and analyzing trends, usage, and activities in connection with our website</li>
              <li>Detecting, preventing, and addressing technical issues</li>
              <li>Protecting the security and integrity of our website and business</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
            <p>We may share your information in the following situations:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf.</li>
              <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              <li><strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information where required to do so by law or in response to valid requests by public authorities.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Privacy Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>The right to access personal information we hold about you</li>
              <li>The right to request that we correct any inaccurate personal information</li>
              <li>The right to request that we delete your personal information</li>
              <li>The right to opt-out of marketing communications</li>
              <li>The right to withdraw consent where we rely on consent to process your information</li>
            </ul>
            <p>To exercise these rights, please contact us using the information provided in the "Contact Us" section.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to collect and use information about you and your interaction with our website. We use these technologies to identify you as a user, analyze trends, administer the website, track user movements around the website, and gather demographic information.
            </p>
            <p>
              You can control cookies through your browser settings and other tools. However, if you block certain cookies, you may not be able to register, login, or access certain parts or make full use of the website.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p>
              We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Websites</h2>
            <p>
              Our website may contain links to third-party websites and applications of interest that are not affiliated with us. Once you have used these links to leave our site, we have no control over and do not monitor the content or privacy practices of these third-party sites. Any information you provide to third-party sites will be governed by the terms of each site's privacy policy, and we encourage you to read their privacy policies before submitting any information.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p>
              Our website is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us. If we become aware that we have collected personal information from children without verification of parental consent, we take steps to remove that information from our servers.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> privacy@obsessiontrigger.com
            </p>
            <p>
              <strong>Address:</strong> Obsession Trigger AI<br />
              123 Relationship Avenue<br />
              Love City, LC 12345<br />
              United States
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;