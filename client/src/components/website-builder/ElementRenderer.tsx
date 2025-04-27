import React from 'react';
import { ElementType } from './ElementControls';
import { cn } from '@/lib/utils';

export interface PageElement {
  id: string;
  type: ElementType;
  props: Record<string, any>;
  children?: PageElement[];
}

interface ElementRendererProps {
  element: PageElement;
  isEditMode?: boolean;
  isSelected?: boolean;
  depth?: number;
  onSelect?: (id: string) => void;
  onDropElement?: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({ 
  element, 
  isEditMode = false,
  isSelected = false,
  depth = 0,
  onSelect,
  onDropElement
}) => {
  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.dataTransfer.setData('elementId', element.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, position: 'before' | 'after' | 'inside') => {
    if (!isEditMode || !onDropElement) return;
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('elementId');
    onDropElement(draggedId, element.id, position);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode || !onSelect) return;
    e.stopPropagation();
    onSelect(element.id);
  };

  // Render element based on its type
  const renderElement = () => {
    switch (element.type) {
      case 'section':
        return (
          <div 
            style={{ 
              padding: element.props.padding, 
              backgroundColor: element.props.backgroundColor,
              width: element.props.fullWidth ? '100%' : undefined
            }}
            className={cn(
              'relative',
              isEditMode && 'min-height-50px',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'inside')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Section
              </div>
            )}
            {(element.children || []).map(child => (
              <ElementRenderer 
                key={child.id} 
                element={child} 
                isEditMode={isEditMode}
                isSelected={isSelected}
                depth={depth + 1}
                onSelect={onSelect}
                onDropElement={onDropElement}
              />
            ))}
            {isEditMode && (element.children || []).length === 0 && (
              <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-300 rounded my-2">
                Drop elements here
              </div>
            )}
          </div>
        );
      
      case 'container':
        return (
          <div 
            style={{ 
              maxWidth: element.props.maxWidth, 
              padding: element.props.padding,
              margin: element.props.margin
            }}
            className={cn(
              'relative',
              isEditMode && 'min-h-[50px]',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'inside')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Container
              </div>
            )}
            {(element.children || []).map(child => (
              <ElementRenderer 
                key={child.id} 
                element={child} 
                isEditMode={isEditMode}
                isSelected={isSelected}
                depth={depth + 1}
                onSelect={onSelect}
                onDropElement={onDropElement}
              />
            ))}
            {isEditMode && (element.children || []).length === 0 && (
              <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-300 rounded my-2">
                Drop elements here
              </div>
            )}
          </div>
        );
      
      case 'row':
        return (
          <div 
            style={{ 
              display: element.props.display,
              flexWrap: element.props.flexWrap,
              margin: element.props.margin
            }}
            className={cn(
              'relative',
              isEditMode && 'min-h-[50px]',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'inside')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Row
              </div>
            )}
            {(element.children || []).map(child => (
              <ElementRenderer 
                key={child.id} 
                element={child} 
                isEditMode={isEditMode}
                isSelected={isSelected}
                depth={depth + 1}
                onSelect={onSelect}
                onDropElement={onDropElement}
              />
            ))}
            {isEditMode && (element.children || []).length === 0 && (
              <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-300 rounded my-2">
                Drop columns here
              </div>
            )}
          </div>
        );
      
      case 'column':
        return (
          <div 
            style={{ 
              flex: element.props.flex,
              padding: element.props.padding
            }}
            className={cn(
              'relative',
              isEditMode && 'min-h-[50px]',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'inside')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Column
              </div>
            )}
            {(element.children || []).map(child => (
              <ElementRenderer 
                key={child.id} 
                element={child} 
                isEditMode={isEditMode}
                isSelected={isSelected}
                depth={depth + 1}
                onSelect={onSelect}
                onDropElement={onDropElement}
              />
            ))}
            {isEditMode && (element.children || []).length === 0 && (
              <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-300 rounded my-2">
                Drop elements here
              </div>
            )}
          </div>
        );
      
      case 'heading':
        const HeadingTag = element.props.level || 'h2';
        return (
          <div
            className={cn(
              'relative',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'after')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Heading
              </div>
            )}
            <HeadingTag
              style={{ 
                color: element.props.color,
                fontSize: element.props.fontSize,
                fontWeight: element.props.fontWeight,
                textAlign: element.props.textAlign as any,
                margin: element.props.margin
              }}
            >
              {isEditMode ? (
                element.props.text || 'Heading Text'
              ) : (
                element.props.text
              )}
            </HeadingTag>
          </div>
        );
      
      case 'text':
        return (
          <div
            className={cn(
              'relative',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'after')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Text
              </div>
            )}
            <p
              style={{ 
                color: element.props.color,
                fontSize: element.props.fontSize,
                lineHeight: element.props.lineHeight,
                textAlign: element.props.textAlign as any,
                margin: element.props.margin
              }}
            >
              {isEditMode ? (
                element.props.text || 'Paragraph Text'
              ) : (
                element.props.text
              )}
            </p>
          </div>
        );
      
      case 'image':
        return (
          <div
            className={cn(
              'relative',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'after')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Image
              </div>
            )}
            {element.props.src ? (
              <img
                src={element.props.src}
                alt={element.props.alt}
                style={{ 
                  width: element.props.width,
                  height: element.props.height,
                  borderRadius: element.props.borderRadius,
                  margin: element.props.margin
                }}
              />
            ) : (
              isEditMode && (
                <div className="bg-gray-200 flex items-center justify-center p-8 rounded" style={{ margin: element.props.margin }}>
                  <span className="text-gray-500">Add image URL in properties</span>
                </div>
              )
            )}
          </div>
        );
      
      case 'button':
        return (
          <div
            className={cn(
              'relative',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'after')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Button
              </div>
            )}
            <div style={{ textAlign: element.props.textAlign as any, margin: element.props.margin }}>
              <button
                style={{ 
                  backgroundColor: element.props.backgroundColor,
                  color: element.props.textColor,
                  fontSize: element.props.fontSize,
                  fontWeight: element.props.fontWeight,
                  padding: element.props.padding,
                  borderRadius: element.props.borderRadius,
                  border: element.props.border
                }}
                onClick={(e) => {
                  if (isEditMode) {
                    e.preventDefault();
                  }
                }}
              >
                {element.props.text}
              </button>
            </div>
          </div>
        );
      
      case 'spacer':
        return (
          <div
            style={{ height: element.props.height }}
            className={cn(
              'relative',
              isEditMode && 'bg-gray-50',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'after')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Spacer
              </div>
            )}
          </div>
        );
      
      case 'divider':
        return (
          <div
            className={cn(
              'relative',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'after')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Divider
              </div>
            )}
            <div
              style={{ 
                width: element.props.width,
                height: element.props.height,
                backgroundColor: element.props.backgroundColor,
                margin: element.props.margin
              }}
            ></div>
          </div>
        );
      
      // Pre-built section templates
      case 'hero':
        return (
          <div 
            style={{ 
              backgroundColor: element.props.backgroundColor,
              color: element.props.textColor,
              padding: element.props.padding,
              backgroundImage: element.props.backgroundImage ? `url(${element.props.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              textAlign: element.props.alignment as any
            }}
            className={cn(
              'relative',
              isEditMode && 'min-h-[200px]',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'inside')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Hero Section
              </div>
            )}
            <div className="container mx-auto px-4 py-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{element.props.title}</h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto">{element.props.subtitle}</p>
              {element.props.buttonText && (
                <button 
                  className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    if (isEditMode) {
                      e.preventDefault();
                    }
                  }}
                >
                  {element.props.buttonText}
                </button>
              )}
            </div>
          </div>
        );

      case 'features':
        return (
          <div 
            style={{ 
              backgroundColor: element.props.backgroundColor,
              color: element.props.textColor,
              padding: element.props.padding
            }}
            className={cn(
              'relative',
              isEditMode && 'min-h-[200px]',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'inside')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Features Section
              </div>
            )}
            <div className="container mx-auto px-4 py-12">
              <h2 className="text-3xl font-bold text-center mb-2">{element.props.title}</h2>
              <p className="text-center mb-12 max-w-2xl mx-auto">{element.props.description}</p>
              
              <div className={`grid grid-cols-1 md:grid-cols-${element.props.columns || 3} gap-8`}>
                {element.props.items?.map((item: any, index: number) => (
                  <div key={index} className="p-6 bg-white rounded-lg shadow-md">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-blue-600 text-xl">{item.icon}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // Default fallback
      default:
        return (
          <div 
            className={cn(
              'p-4 border border-gray-200 rounded',
              isEditMode && 'min-h-[50px]',
              isSelected && 'outline outline-2 outline-blue-500'
            )}
            onClick={handleClick}
            draggable={isEditMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'inside')}
          >
            {isEditMode && (
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t">
                Unknown Element
              </div>
            )}
            {isEditMode && `Unknown element type: ${element.type}`}
            {(element.children || []).map(child => (
              <ElementRenderer 
                key={child.id} 
                element={child} 
                isEditMode={isEditMode}
                isSelected={isSelected}
                depth={depth + 1}
                onSelect={onSelect}
                onDropElement={onDropElement}
              />
            ))}
          </div>
        );
    }
  };

  return renderElement();
};

export default ElementRenderer;