import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageElement } from './ElementRenderer';

interface PropertyEditorProps {
  selectedElement: PageElement | null;
  onUpdateElementProps: (id: string, props: Record<string, any>) => void;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ 
  selectedElement, 
  onUpdateElementProps 
}) => {
  if (!selectedElement) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            Select an element to edit its properties
          </p>
        </CardContent>
      </Card>
    );
  }

  const handlePropChange = (key: string, value: any) => {
    onUpdateElementProps(selectedElement.id, { ...selectedElement.props, [key]: value });
  };

  // Helper to render different property types
  const renderPropField = (key: string, value: any) => {
    // Skip certain complex props that need special handling
    if (key === 'items' || key === 'plans' || key === 'images' || key === 'fields') {
      return null;
    }

    // Determine the type of the property for appropriate input
    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center justify-between mb-4" key={key}>
          <Label htmlFor={key} className="flex-1">{formatPropName(key)}</Label>
          <Switch 
            id={key}
            checked={value} 
            onCheckedChange={(checked) => handlePropChange(key, checked)}
          />
        </div>
      );
    }

    if (typeof value === 'string') {
      // Handle specific prop types with specialized inputs
      if (key === 'backgroundColor' || key === 'color' || key === 'textColor') {
        return (
          <div className="mb-4" key={key}>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor={key}>{formatPropName(key)}</Label>
              <div 
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: value }}
              ></div>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                id={key}
                value={value} 
                onChange={(e) => handlePropChange(key, e.target.value)}
              />
              <Input 
                id={`${key}-color`}
                type="color" 
                value={value}
                className="w-10 p-0 h-10"
                onChange={(e) => handlePropChange(key, e.target.value)}
              />
            </div>
          </div>
        );
      }

      // Handle text alignment
      if (key === 'textAlign' || key === 'alignment') {
        return (
          <div className="mb-4" key={key}>
            <Label htmlFor={key} className="mb-2 block">{formatPropName(key)}</Label>
            <Select 
              value={value}
              onValueChange={(val) => handlePropChange(key, val)}
            >
              <SelectTrigger id={key}>
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="justify">Justify</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      }

      // Handle heading level
      if (key === 'level' && selectedElement.type === 'heading') {
        return (
          <div className="mb-4" key={key}>
            <Label htmlFor={key} className="mb-2 block">{formatPropName(key)}</Label>
            <Select 
              value={value}
              onValueChange={(val) => handlePropChange(key, val)}
            >
              <SelectTrigger id={key}>
                <SelectValue placeholder="Select heading level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">H1</SelectItem>
                <SelectItem value="h2">H2</SelectItem>
                <SelectItem value="h3">H3</SelectItem>
                <SelectItem value="h4">H4</SelectItem>
                <SelectItem value="h5">H5</SelectItem>
                <SelectItem value="h6">H6</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      }

      // Handle longer text with textarea
      if (key === 'text' && value.length > 50) {
        return (
          <div className="mb-4" key={key}>
            <Label htmlFor={key} className="mb-2 block">{formatPropName(key)}</Label>
            <Textarea 
              id={key}
              value={value} 
              rows={4}
              onChange={(e) => handlePropChange(key, e.target.value)}
            />
          </div>
        );
      }

      // Default to standard input for strings
      return (
        <div className="mb-4" key={key}>
          <Label htmlFor={key} className="mb-2 block">{formatPropName(key)}</Label>
          <Input 
            id={key}
            value={value} 
            onChange={(e) => handlePropChange(key, e.target.value)}
          />
        </div>
      );
    }

    // For numeric values
    if (typeof value === 'number') {
      return (
        <div className="mb-4" key={key}>
          <Label htmlFor={key} className="mb-2 block">{formatPropName(key)}</Label>
          <Input 
            id={key}
            type="number" 
            value={value} 
            onChange={(e) => handlePropChange(key, Number(e.target.value))}
          />
        </div>
      );
    }

    // Default for other types
    return (
      <div className="mb-4" key={key}>
        <Label htmlFor={key} className="mb-2 block">{formatPropName(key)}</Label>
        <Input 
          id={key}
          value={String(value)} 
          onChange={(e) => handlePropChange(key, e.target.value)}
        />
      </div>
    );
  };

  // Helper for special complex properties
  const renderComplexProps = () => {
    // For feature section items
    if (selectedElement.type === 'features' && selectedElement.props.items) {
      return (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium mb-3">Features</h3>
          {selectedElement.props.items.map((item: any, index: number) => (
            <div key={index} className="mb-4 border p-3 rounded">
              <div className="mb-2">
                <Label htmlFor={`feature-title-${index}`} className="mb-1 block">Title</Label>
                <Input
                  id={`feature-title-${index}`}
                  value={item.title}
                  onChange={(e) => {
                    const newItems = [...selectedElement.props.items];
                    newItems[index].title = e.target.value;
                    handlePropChange('items', newItems);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`feature-description-${index}`} className="mb-1 block">Description</Label>
                <Textarea
                  id={`feature-description-${index}`}
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...selectedElement.props.items];
                    newItems[index].description = e.target.value;
                    handlePropChange('items', newItems);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`feature-icon-${index}`} className="mb-1 block">Icon</Label>
                <Input
                  id={`feature-icon-${index}`}
                  value={item.icon}
                  onChange={(e) => {
                    const newItems = [...selectedElement.props.items];
                    newItems[index].icon = e.target.value;
                    handlePropChange('items', newItems);
                  }}
                />
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  const newItems = selectedElement.props.items.filter((_: any, i: number) => i !== index);
                  handlePropChange('items', newItems);
                }}
              >
                Remove Feature
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newItems = [
                ...selectedElement.props.items,
                { title: 'New Feature', description: 'Description goes here', icon: 'star' }
              ];
              handlePropChange('items', newItems);
            }}
          >
            Add Feature
          </Button>
        </div>
      );
    }

    // For testimonials
    if (selectedElement.type === 'testimonials' && selectedElement.props.items) {
      return (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium mb-3">Testimonials</h3>
          {selectedElement.props.items.map((item: any, index: number) => (
            <div key={index} className="mb-4 border p-3 rounded">
              <div className="mb-2">
                <Label htmlFor={`testimonial-name-${index}`} className="mb-1 block">Name</Label>
                <Input
                  id={`testimonial-name-${index}`}
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...selectedElement.props.items];
                    newItems[index].name = e.target.value;
                    handlePropChange('items', newItems);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`testimonial-role-${index}`} className="mb-1 block">Role</Label>
                <Input
                  id={`testimonial-role-${index}`}
                  value={item.role}
                  onChange={(e) => {
                    const newItems = [...selectedElement.props.items];
                    newItems[index].role = e.target.value;
                    handlePropChange('items', newItems);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`testimonial-text-${index}`} className="mb-1 block">Text</Label>
                <Textarea
                  id={`testimonial-text-${index}`}
                  value={item.text}
                  onChange={(e) => {
                    const newItems = [...selectedElement.props.items];
                    newItems[index].text = e.target.value;
                    handlePropChange('items', newItems);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`testimonial-image-${index}`} className="mb-1 block">Image URL</Label>
                <Input
                  id={`testimonial-image-${index}`}
                  value={item.image}
                  onChange={(e) => {
                    const newItems = [...selectedElement.props.items];
                    newItems[index].image = e.target.value;
                    handlePropChange('items', newItems);
                  }}
                />
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  const newItems = selectedElement.props.items.filter((_: any, i: number) => i !== index);
                  handlePropChange('items', newItems);
                }}
              >
                Remove Testimonial
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newItems = [
                ...selectedElement.props.items,
                { name: 'New Customer', role: 'Position', text: 'Testimonial text goes here', image: '' }
              ];
              handlePropChange('items', newItems);
            }}
          >
            Add Testimonial
          </Button>
        </div>
      );
    }

    // For pricing plans
    if (selectedElement.type === 'pricing' && selectedElement.props.plans) {
      return (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium mb-3">Pricing Plans</h3>
          {selectedElement.props.plans.map((plan: any, index: number) => (
            <div key={index} className="mb-4 border p-3 rounded">
              <div className="mb-2">
                <Label htmlFor={`plan-name-${index}`} className="mb-1 block">Plan Name</Label>
                <Input
                  id={`plan-name-${index}`}
                  value={plan.name}
                  onChange={(e) => {
                    const newPlans = [...selectedElement.props.plans];
                    newPlans[index].name = e.target.value;
                    handlePropChange('plans', newPlans);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`plan-price-${index}`} className="mb-1 block">Price</Label>
                <Input
                  id={`plan-price-${index}`}
                  value={plan.price}
                  onChange={(e) => {
                    const newPlans = [...selectedElement.props.plans];
                    newPlans[index].price = e.target.value;
                    handlePropChange('plans', newPlans);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`plan-period-${index}`} className="mb-1 block">Period</Label>
                <Input
                  id={`plan-period-${index}`}
                  value={plan.period}
                  onChange={(e) => {
                    const newPlans = [...selectedElement.props.plans];
                    newPlans[index].period = e.target.value;
                    handlePropChange('plans', newPlans);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`plan-button-text-${index}`} className="mb-1 block">Button Text</Label>
                <Input
                  id={`plan-button-text-${index}`}
                  value={plan.buttonText}
                  onChange={(e) => {
                    const newPlans = [...selectedElement.props.plans];
                    newPlans[index].buttonText = e.target.value;
                    handlePropChange('plans', newPlans);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`plan-button-url-${index}`} className="mb-1 block">Button URL</Label>
                <Input
                  id={`plan-button-url-${index}`}
                  value={plan.buttonUrl}
                  onChange={(e) => {
                    const newPlans = [...selectedElement.props.plans];
                    newPlans[index].buttonUrl = e.target.value;
                    handlePropChange('plans', newPlans);
                  }}
                />
              </div>
              <div className="flex items-center mb-3">
                <Label htmlFor={`plan-highlighted-${index}`} className="flex-1">Highlighted</Label>
                <Switch
                  id={`plan-highlighted-${index}`}
                  checked={plan.highlighted}
                  onCheckedChange={(checked) => {
                    const newPlans = [...selectedElement.props.plans];
                    newPlans[index].highlighted = checked;
                    handlePropChange('plans', newPlans);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label className="mb-1 block">Features</Label>
                {plan.features.map((feature: string, featureIndex: number) => (
                  <div className="flex items-center gap-2 mb-1" key={featureIndex}>
                    <Input
                      value={feature}
                      onChange={(e) => {
                        const newPlans = [...selectedElement.props.plans];
                        newPlans[index].features[featureIndex] = e.target.value;
                        handlePropChange('plans', newPlans);
                      }}
                    />
                    <Button 
                      variant="destructive" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const newPlans = [...selectedElement.props.plans];
                        newPlans[index].features = newPlans[index].features.filter((_: any, i: number) => i !== featureIndex);
                        handlePropChange('plans', newPlans);
                      }}
                    >
                      -
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-1"
                  onClick={() => {
                    const newPlans = [...selectedElement.props.plans];
                    newPlans[index].features.push('New Feature');
                    handlePropChange('plans', newPlans);
                  }}
                >
                  Add Feature
                </Button>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  const newPlans = selectedElement.props.plans.filter((_: any, i: number) => i !== index);
                  handlePropChange('plans', newPlans);
                }}
              >
                Remove Plan
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newPlans = [
                ...selectedElement.props.plans,
                { 
                  name: 'New Plan', 
                  price: '$0', 
                  period: 'monthly', 
                  features: ['Feature 1', 'Feature 2'],
                  buttonText: 'Sign Up',
                  buttonUrl: '#',
                  highlighted: false
                }
              ];
              handlePropChange('plans', newPlans);
            }}
          >
            Add Pricing Plan
          </Button>
        </div>
      );
    }

    // For gallery images
    if (selectedElement.type === 'gallery' && selectedElement.props.images) {
      return (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium mb-3">Gallery Images</h3>
          {selectedElement.props.images.map((image: any, index: number) => (
            <div key={index} className="mb-3 flex items-center gap-2">
              <Input
                value={image.src}
                placeholder="Image URL"
                onChange={(e) => {
                  const newImages = [...selectedElement.props.images];
                  newImages[index].src = e.target.value;
                  handlePropChange('images', newImages);
                }}
              />
              <Button 
                variant="destructive" 
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => {
                  const newImages = selectedElement.props.images.filter((_: any, i: number) => i !== index);
                  handlePropChange('images', newImages);
                }}
              >
                -
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newImages = [
                ...selectedElement.props.images,
                { src: '', alt: 'Gallery image' }
              ];
              handlePropChange('images', newImages);
            }}
          >
            Add Image
          </Button>
        </div>
      );
    }

    // For contact form fields
    if (selectedElement.type === 'contactForm' && selectedElement.props.fields) {
      return (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium mb-3">Form Fields</h3>
          {selectedElement.props.fields.map((field: any, index: number) => (
            <div key={index} className="mb-4 border p-3 rounded">
              <div className="mb-2">
                <Label htmlFor={`field-type-${index}`} className="mb-1 block">Field Type</Label>
                <Select
                  value={field.type}
                  onValueChange={(value) => {
                    const newFields = [...selectedElement.props.fields];
                    newFields[index].type = value;
                    handlePropChange('fields', newFields);
                  }}
                >
                  <SelectTrigger id={`field-type-${index}`}>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-2">
                <Label htmlFor={`field-label-${index}`} className="mb-1 block">Label</Label>
                <Input
                  id={`field-label-${index}`}
                  value={field.label}
                  onChange={(e) => {
                    const newFields = [...selectedElement.props.fields];
                    newFields[index].label = e.target.value;
                    handlePropChange('fields', newFields);
                  }}
                />
              </div>
              <div className="mb-2">
                <Label htmlFor={`field-placeholder-${index}`} className="mb-1 block">Placeholder</Label>
                <Input
                  id={`field-placeholder-${index}`}
                  value={field.placeholder}
                  onChange={(e) => {
                    const newFields = [...selectedElement.props.fields];
                    newFields[index].placeholder = e.target.value;
                    handlePropChange('fields', newFields);
                  }}
                />
              </div>
              <div className="flex items-center mb-3">
                <Label htmlFor={`field-required-${index}`} className="flex-1">Required</Label>
                <Switch
                  id={`field-required-${index}`}
                  checked={field.required}
                  onCheckedChange={(checked) => {
                    const newFields = [...selectedElement.props.fields];
                    newFields[index].required = checked;
                    handlePropChange('fields', newFields);
                  }}
                />
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  const newFields = selectedElement.props.fields.filter((_: any, i: number) => i !== index);
                  handlePropChange('fields', newFields);
                }}
              >
                Remove Field
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newFields = [
                ...selectedElement.props.fields,
                { type: 'text', label: 'New Field', placeholder: 'Enter value', required: false }
              ];
              handlePropChange('fields', newFields);
            }}
          >
            Add Form Field
          </Button>
        </div>
      );
    }

    return null;
  };

  // Helper to format property names
  const formatPropName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  // Group properties for better organization
  const groupProperties = () => {
    const allProps = selectedElement.props;
    
    // Basic properties that most elements should have first
    const basicProps: Record<string, any> = {};
    const stylingProps: Record<string, any> = {};
    const advancedProps: Record<string, any> = {};
    
    // Sort properties into groups
    Object.entries(allProps).forEach(([key, value]) => {
      if (['text', 'src', 'alt', 'url', 'level', 'title', 'subtitle', 'description', 'buttonText', 'buttonUrl'].includes(key)) {
        basicProps[key] = value;
      } else if (['color', 'backgroundColor', 'textColor', 'padding', 'margin', 'width', 'height', 'borderRadius', 'fontSize', 'fontWeight', 'textAlign', 'lineHeight', 'alignment'].includes(key)) {
        stylingProps[key] = value;
      } else if (!['items', 'plans', 'images', 'fields'].includes(key)) {
        advancedProps[key] = value;
      }
    });
    
    return { basicProps, stylingProps, advancedProps };
  };
  
  const { basicProps, stylingProps, advancedProps } = groupProperties();
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">
          {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="p-4">
            <Tabs defaultValue="basic">
              <TabsList className="w-full">
                <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
                <TabsTrigger value="styling" className="flex-1">Styling</TabsTrigger>
                <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="mt-4">
                {Object.entries(basicProps).map(([key, value]) => renderPropField(key, value))}
                {renderComplexProps()}
              </TabsContent>
              
              <TabsContent value="styling" className="mt-4">
                {Object.entries(stylingProps).map(([key, value]) => renderPropField(key, value))}
              </TabsContent>
              
              <TabsContent value="advanced" className="mt-4">
                {Object.entries(advancedProps).map(([key, value]) => renderPropField(key, value))}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PropertyEditor;