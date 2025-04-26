import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Separator } from '@/components/ui/separator';

const TermsOfService = () => {
  // Scroll to top on component mount
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Terms of Service</h1>
        <Separator className="mb-8" />
        
        <div className="prose max-w-none dark:prose-invert">
          <p className="text-lg mb-4">Last Updated: April 25, 2025</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p>
              Welcome to Obsession Trigger AI. These Terms of Service ("Terms") govern your access to and use of the Obsession Trigger AI website, services, and applications (collectively, the "Services"). Please read these Terms carefully before using our Services.
            </p>
            <p>
              By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use our Services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Using Our Services</h2>
            <h3 className="text-xl font-medium mt-4 mb-2">Eligibility</h3>
            <p>
              You must be at least 18 years old to use our Services. By using our Services, you represent and warrant that you are at least 18 years old and that you have the right, authority, and capacity to enter into and abide by these Terms.
            </p>
            
            <h3 className="text-xl font-medium mt-4 mb-2">User Accounts</h3>
            <p>
              Some features of our Services may require you to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.
            </p>
            <p>
              You are responsible for providing accurate, current, and complete information during the registration process and for keeping your information up-to-date.
            </p>
            
            <h3 className="text-xl font-medium mt-4 mb-2">Prohibited Uses</h3>
            <p>
              You agree not to use the Services:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation</li>
              <li>To impersonate or attempt to impersonate Obsession Trigger AI, an Obsession Trigger AI employee, another user, or any other person or entity</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Services, or which may harm Obsession Trigger AI or users of the Services</li>
              <li>To attempt to access, tamper with, or use non-public areas of the Services, our computer systems, or the technical delivery systems of our providers</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Content and Intellectual Property</h2>
            <h3 className="text-xl font-medium mt-4 mb-2">User Content</h3>
            <p>
              Our Services may allow you to submit, post, or share content such as quiz responses, feedback, and comments ("User Content"). You retain ownership of your User Content, but you grant us a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your User Content in connection with the Services and our business.
            </p>
            <p>
              You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You own or have the necessary rights to your User Content and have the right to grant us the license described above</li>
              <li>Your User Content does not violate the privacy rights, publicity rights, copyright rights, contractual rights, or any other rights of any person or entity</li>
            </ul>
            
            <h3 className="text-xl font-medium mt-4 mb-2">Our Content</h3>
            <p>
              Unless otherwise indicated, the Services and all content and materials available through the Services, including but not limited to our logo, design, text, graphics, photos, videos, information, software, code, and files, are owned by or licensed to Obsession Trigger AI and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              We grant you a limited, non-exclusive, non-transferable, and revocable license to access and use the Services and our content for your personal, non-commercial use. You may not:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any of our content</li>
              <li>Use any data mining, robots, or similar data gathering or extraction methods</li>
              <li>Download any of our content except as expressly permitted</li>
              <li>Remove any copyright, trademark, or other proprietary notices</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Disclaimer of Warranties</h2>
            <p>
              OUR SERVICES AND ALL CONTENT AVAILABLE THROUGH OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              OBSESSION TRIGGER AI DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT OUR SERVICES OR THE SERVER THAT MAKES IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
            <p>
              THE INFORMATION AND ADVICE PROVIDED BY OUR SERVICES IS NOT INTENDED AS A SUBSTITUTE FOR PROFESSIONAL ADVICE. YOU SHOULD CONSULT WITH A QUALIFIED PROFESSIONAL FOR SPECIFIC ADVICE TAILORED TO YOUR SITUATION.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL OBSESSION TRIGGER AI, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS, BE LIABLE TO YOU FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES WHATSOEVER RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES</li>
              <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES</li>
              <li>ANY CONTENT OBTAINED FROM THE SERVICES</li>
              <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT</li>
            </ul>
            <p>
              WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.
            </p>
            <p>
              SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR THE LIMITATION OR EXCLUSION OF LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Obsession Trigger AI, its officers, directors, employees, and agents, from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p>
              We may terminate or suspend your account or access to the Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
            </p>
            <p>
              Upon termination, your right to use the Services will immediately cease. If you wish to terminate your account, you may simply discontinue using the Services or delete your account.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p>
              We may revise and update these Terms from time to time in our sole discretion. All changes are effective when they are posted and apply to all access to and use of the Services thereafter.
            </p>
            <p>
              Your continued use of the Services following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
            <p>
              These Terms and your use of the Services shall be governed by and construed in accordance with the laws of the United States, without giving effect to any principles of conflicts of law.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> terms@obsessiontrigger.com
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

export default TermsOfService;