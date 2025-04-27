import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Type, 
  Image, 
  ListTodo, 
  BarChart, 
  MessageSquare, 
  FileText, 
  CreditCard, 
  Mail, 
  Plus, 
  Trash,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export type ElementType = 
  | 'section' 
  | 'container' 
  | 'row' 
  | 'column' 
  | 'heading' 
  | 'text' 
  | 'image' 
  | 'button' 
  | 'spacer'
  | 'divider'
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'callToAction'
  | 'gallery'
  | 'contactForm'
  | 'sidebar'
  | 'sidebarMenu'
  | 'sidebarWidget'
  | 'sidebarCta';

export interface ElementTemplate {
  type: ElementType;
  name: string;
  icon?: React.ReactNode;
  defaultProps?: Record<string, any>;
}

const SIDEBAR_ELEMENTS: ElementTemplate[] = [
  {
    type: 'sidebar',
    name: 'Sidebar',
    icon: <LayoutDashboard className="h-5 w-5" />,
    defaultProps: {
      width: '300px',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRight: '1px solid #e9ecef'
    }
  },
  {
    type: 'sidebarMenu',
    name: 'Sidebar Menu',
    icon: <ListTodo className="h-5 w-5" />,
    defaultProps: {
      items: [
        { text: 'Home', url: '/', icon: 'home' },
        { text: 'About', url: '/about', icon: 'info' },
        { text: 'Services', url: '/services', icon: 'briefcase' },
        { text: 'Contact', url: '/contact', icon: 'mail' }
      ],
      textColor: '#333333',
      activeColor: '#0070f3',
      fontSize: '16px',
      spacing: '15px'
    }
  },
  {
    type: 'sidebarWidget',
    name: 'Sidebar Widget',
    icon: <LayoutDashboard className="h-5 w-5" />,
    defaultProps: {
      title: 'Widget Title',
      backgroundColor: '#ffffff',
      padding: '15px',
      borderRadius: '4px',
      margin: '0 0 20px 0',
      border: '1px solid #e0e0e0'
    }
  },
  {
    type: 'sidebarCta',
    name: 'Sidebar CTA',
    icon: <CreditCard className="h-5 w-5" />,
    defaultProps: {
      title: 'Ready to Start?',
      text: 'Sign up now and get 20% off your first order',
      buttonText: 'Sign Up',
      buttonUrl: '#',
      backgroundColor: '#0070f3',
      textColor: '#ffffff',
      padding: '20px',
      borderRadius: '4px',
      alignment: 'center'
    }
  },
];

const BASIC_ELEMENTS: ElementTemplate[] = [
  { 
    type: 'section', 
    name: 'Section',
    icon: <LayoutDashboard className="h-5 w-5" />,
    defaultProps: { 
      padding: '40px 0',
      backgroundColor: '#ffffff',
      fullWidth: false
    }
  },
  { 
    type: 'container', 
    name: 'Container',
    icon: <LayoutDashboard className="h-5 w-5" />,
    defaultProps: { 
      maxWidth: '1200px',
      padding: '0 15px',
      margin: '0 auto'
    }
  },
  { 
    type: 'row', 
    name: 'Row',
    icon: <LayoutDashboard className="h-5 w-5" />,
    defaultProps: { 
      display: 'flex',
      flexWrap: 'wrap',
      margin: '0 -15px'
    }
  },
  { 
    type: 'column', 
    name: 'Column',
    icon: <LayoutDashboard className="h-5 w-5" />,
    defaultProps: { 
      flex: '1',
      padding: '0 15px'
    }
  },
  { 
    type: 'heading', 
    name: 'Heading',
    icon: <Type className="h-5 w-5" />,
    defaultProps: { 
      text: 'Enter heading text',
      level: 'h2',
      color: '#333333',
      fontSize: '28px',
      fontWeight: '700',
      textAlign: 'left',
      margin: '0 0 20px 0'
    }
  },
  { 
    type: 'text', 
    name: 'Paragraph',
    icon: <FileText className="h-5 w-5" />,
    defaultProps: { 
      text: 'Enter paragraph text here. This is a sample text that you can edit.',
      color: '#666666',
      fontSize: '16px',
      lineHeight: '1.6',
      textAlign: 'left',
      margin: '0 0 15px 0'
    }
  },
  { 
    type: 'image', 
    name: 'Image',
    icon: <Image className="h-5 w-5" />,
    defaultProps: { 
      src: '',
      alt: 'Image description',
      width: '100%',
      height: 'auto',
      borderRadius: '0',
      margin: '0 0 20px 0'
    }
  },
  { 
    type: 'button', 
    name: 'Button',
    icon: <CreditCard className="h-5 w-5" />,
    defaultProps: { 
      text: 'Click Me',
      url: '#',
      backgroundColor: '#0070f3',
      textColor: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      padding: '10px 20px',
      borderRadius: '4px',
      border: 'none',
      margin: '10px 0',
      textAlign: 'center'
    }
  },
  { 
    type: 'spacer', 
    name: 'Spacer',
    icon: <LayoutDashboard className="h-5 w-5" />,
    defaultProps: { 
      height: '40px'
    }
  },
  { 
    type: 'divider', 
    name: 'Divider',
    icon: <LayoutDashboard className="h-5 w-5" />,
    defaultProps: { 
      width: '100%',
      height: '1px',
      backgroundColor: '#e0e0e0',
      margin: '20px 0'
    }
  }
];

const SECTION_TEMPLATES: ElementTemplate[] = [
  { 
    type: 'hero', 
    name: 'Hero Section',
    icon: <LayoutDashboard className="h-5 w-5" />,
    defaultProps: { 
      title: 'Welcome to Our Website',
      subtitle: 'Discover the amazing features and services we offer',
      buttonText: 'Get Started',
      buttonUrl: '#',
      backgroundImage: '',
      backgroundColor: '#f7f9fc',
      textColor: '#333333',
      alignment: 'center',
      padding: '80px 0'
    }
  },
  { 
    type: 'features', 
    name: 'Features Section',
    icon: <ListTodo className="h-5 w-5" />,
    defaultProps: { 
      title: 'Our Features',
      description: 'Discover what makes our service stand out',
      items: [
        { title: 'Feature 1', description: 'Description of feature 1', icon: 'zap' },
        { title: 'Feature 2', description: 'Description of feature 2', icon: 'shield' },
        { title: 'Feature 3', description: 'Description of feature 3', icon: 'star' }
      ],
      columns: 3,
      backgroundColor: '#ffffff',
      textColor: '#333333',
      padding: '60px 0'
    }
  },
  { 
    type: 'testimonials', 
    name: 'Testimonials',
    icon: <MessageSquare className="h-5 w-5" />,
    defaultProps: { 
      title: 'What Our Customers Say',
      description: 'Read testimonials from our satisfied customers',
      items: [
        { name: 'John Doe', role: 'CEO', text: 'Testimonial text goes here', image: '' },
        { name: 'Jane Smith', role: 'Designer', text: 'Testimonial text goes here', image: '' },
        { name: 'Mike Johnson', role: 'Developer', text: 'Testimonial text goes here', image: '' }
      ],
      backgroundColor: '#f7f9fc',
      textColor: '#333333',
      padding: '60px 0'
    }
  },
  { 
    type: 'pricing', 
    name: 'Pricing Tables',
    icon: <BarChart className="h-5 w-5" />,
    defaultProps: { 
      title: 'Pricing Plans',
      description: 'Choose the plan that works for you',
      plans: [
        { 
          name: 'Basic', 
          price: '$9.99', 
          period: 'monthly', 
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
          buttonText: 'Get Started',
          buttonUrl: '#',
          highlighted: false
        },
        { 
          name: 'Pro', 
          price: '$19.99', 
          period: 'monthly', 
          features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5'],
          buttonText: 'Get Started',
          buttonUrl: '#',
          highlighted: true
        },
        { 
          name: 'Enterprise', 
          price: '$29.99', 
          period: 'monthly', 
          features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5', 'Feature 6', 'Feature 7'],
          buttonText: 'Get Started',
          buttonUrl: '#',
          highlighted: false
        }
      ],
      backgroundColor: '#ffffff',
      textColor: '#333333',
      padding: '60px 0'
    }
  },
  { 
    type: 'callToAction', 
    name: 'Call to Action',
    icon: <CreditCard className="h-5 w-5" />,
    defaultProps: { 
      title: 'Ready to Get Started?',
      description: 'Join thousands of satisfied customers today',
      buttonText: 'Sign Up Now',
      buttonUrl: '#',
      backgroundColor: '#0070f3',
      textColor: '#ffffff',
      padding: '60px 0',
      alignment: 'center'
    }
  },
  { 
    type: 'gallery', 
    name: 'Image Gallery',
    icon: <Image className="h-5 w-5" />,
    defaultProps: { 
      title: 'Our Gallery',
      description: 'Check out our latest work',
      images: [
        { src: '', alt: 'Gallery image 1' },
        { src: '', alt: 'Gallery image 2' },
        { src: '', alt: 'Gallery image 3' },
        { src: '', alt: 'Gallery image 4' },
        { src: '', alt: 'Gallery image 5' },
        { src: '', alt: 'Gallery image 6' }
      ],
      columns: 3,
      gap: '15px',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      padding: '60px 0'
    }
  },
  { 
    type: 'contactForm', 
    name: 'Contact Form',
    icon: <Mail className="h-5 w-5" />,
    defaultProps: { 
      title: 'Contact Us',
      description: 'Get in touch with our team',
      fields: [
        { type: 'text', label: 'Name', placeholder: 'Your name', required: true },
        { type: 'email', label: 'Email', placeholder: 'Your email', required: true },
        { type: 'text', label: 'Subject', placeholder: 'Message subject', required: false },
        { type: 'textarea', label: 'Message', placeholder: 'Your message', required: true }
      ],
      buttonText: 'Send Message',
      backgroundColor: '#f7f9fc',
      textColor: '#333333',
      padding: '60px 0'
    }
  }
];

interface ElementControlsProps {
  onAddElement: (element: ElementTemplate) => void;
  onMoveElement: (direction: 'up' | 'down') => void;
  onDeleteElement: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isElementSelected: boolean;
}

const ElementControls: React.FC<ElementControlsProps> = ({
  onAddElement,
  onMoveElement,
  onDeleteElement,
  canMoveUp,
  canMoveDown,
  isElementSelected
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Elements</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="basic">
          <TabsList className="w-full">
            <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
            <TabsTrigger value="sections" className="flex-1">Sections</TabsTrigger>
            <TabsTrigger value="sidebar" className="flex-1">Sidebar</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[calc(100vh-300px)]">
            <TabsContent value="basic" className="m-0 p-4 pt-2">
              <div className="grid grid-cols-2 gap-2">
                {BASIC_ELEMENTS.map((element) => (
                  <Button
                    key={element.type}
                    variant="outline"
                    className="h-auto py-4 px-2 flex flex-col items-center justify-center gap-2"
                    onClick={() => onAddElement(element)}
                  >
                    {element.icon}
                    <span className="text-xs">{element.name}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="sections" className="m-0 p-4 pt-2">
              <div className="grid grid-cols-1 gap-2">
                {SECTION_TEMPLATES.map((element) => (
                  <Button
                    key={element.type}
                    variant="outline"
                    className="h-auto py-4 px-3 flex items-center justify-start gap-3 text-left"
                    onClick={() => onAddElement(element)}
                  >
                    {element.icon}
                    <span>{element.name}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="sidebar" className="m-0 p-4 pt-2">
              <div className="grid grid-cols-1 gap-2">
                {SIDEBAR_ELEMENTS.map((element) => (
                  <Button
                    key={element.type}
                    variant="outline"
                    className="h-auto py-4 px-3 flex items-center justify-start gap-3 text-left"
                    onClick={() => onAddElement(element)}
                  >
                    {element.icon}
                    <span>{element.name}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        {isElementSelected && (
          <div className="p-4 border-t">
            <p className="text-sm font-medium mb-3">Selected Element</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={!canMoveUp}
                onClick={() => onMoveElement('up')}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={!canMoveDown}
                onClick={() => onMoveElement('down')}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={onDeleteElement}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ElementControls;
export { BASIC_ELEMENTS, SECTION_TEMPLATES, SIDEBAR_ELEMENTS };