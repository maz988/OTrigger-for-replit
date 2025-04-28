import { jsPDF } from "jspdf";
import { QuizFormData, EmailFormData } from "@shared/schema";
// Import autotable plugin for better formatting
import 'jspdf-autotable';

// Strip HTML tags from text for PDF generation
function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // First remove entire affiliate-callout divs
  // Using a multi-step approach to avoid regex compatibility issues
  let startIndex = html.indexOf('<div class="affiliate-callout');
  let text = html;
  
  while (startIndex !== -1) {
    const endIndex = html.indexOf('</div>', startIndex);
    if (endIndex === -1) break;
    
    text = text.substring(0, startIndex) + text.substring(endIndex + 6);
    startIndex = text.indexOf('<div class="affiliate-callout');
  }
  
  // Helper function to replace HTML tags with their content
  const replaceTag = (input: string, tagStart: string, tagEnd: string, replacement: string = '$1'): string => {
    let result = input;
    let startPos = result.indexOf(tagStart);
    
    while (startPos !== -1) {
      const contentStart = startPos + tagStart.length;
      const endPos = result.indexOf(tagEnd, contentStart);
      
      if (endPos === -1) break;
      
      const tagContent = result.substring(contentStart, endPos);
      const replaceContent = replacement.replace('$1', tagContent);
      
      result = result.substring(0, startPos) + replaceContent + result.substring(endPos + tagEnd.length);
      startPos = result.indexOf(tagStart);
    }
    
    return result;
  };
  
  // Replace common HTML tags
  text = replaceTag(text, '<h1', '</h1>');
  text = replaceTag(text, '<h2', '</h2>');
  text = replaceTag(text, '<h3', '</h3>');
  text = replaceTag(text, '<h4', '</h4>');
  text = replaceTag(text, '<h5', '</h5>');
  text = replaceTag(text, '<h6', '</h6>');
  text = replaceTag(text, '<p', '</p>');
  text = replaceTag(text, '<a', '</a>');
  text = replaceTag(text, '<li', '</li>', '• $1');
  
  // Replace <br> tags with newlines
  text = text.replace(/<br\s*\/?>/g, '\n');
  
  // Remove list containers
  text = text.replace(/<ul[^>]*>/g, '').replace(/<\/ul>/g, '');
  text = text.replace(/<ol[^>]*>/g, '').replace(/<\/ol>/g, '');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Clean up whitespace
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

interface GeneratePDFParams {
  quizData: QuizFormData;
  userData: EmailFormData;
  advice: string;
  affiliateLink: string;
}

export const generatePDF = ({
  quizData,
  userData,
  advice,
  affiliateLink
}: GeneratePDFParams): jsPDF => {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Set up document properties
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Function to add stylish page decoration
  const addPageDecoration = () => {
    // Add decorative header and footer borders
    doc.setFillColor(252, 231, 243); // light pink #fce7f3
    doc.rect(0, 0, pageWidth, 30, 'F'); // Top header background
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F'); // Bottom footer background
    
    // Add a subtle side border
    doc.setFillColor(254, 242, 250); // Very light pink
    doc.rect(0, 30, 8, pageHeight - 45, 'F'); // Left border
    doc.rect(pageWidth - 8, 30, 8, pageHeight - 45, 'F'); // Right border
  };
  
  // Add the decorative elements
  addPageDecoration();
  
  // Draw logo elements
  const logoX = margin + 6;
  const logoY = margin - 5;
  
  // Draw stylized "OT" logo (Obsession Trigger)
  doc.setFillColor(242, 75, 124); // Main pink
  
  // O shape (circle)
  doc.circle(logoX, logoY, 5, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(logoX, logoY, 3, 'F');
  
  // T shape
  doc.setFillColor(242, 75, 124);
  doc.rect(logoX + 6, logoY - 5, 8, 2.5, 'F');
  doc.rect(logoX + 8.5, logoY - 5, 3, 10, 'F');
  
  // Draw heart icon on the right side
  const heartX = pageWidth - margin - 8;
  const heartY = margin - 2;
  
  // Heart shape
  doc.setDrawColor(242, 75, 124);
  doc.setFillColor(242, 75, 124);
  doc.setLineWidth(0.5);
  
  // Left half of heart
  doc.circle(heartX - 1.5, heartY, 3, 'F');
  // Right half of heart
  doc.circle(heartX + 1.5, heartY, 3, 'F');
  // Bottom triangle of heart
  doc.triangle(
    heartX - 4.5, heartY, 
    heartX + 4.5, heartY, 
    heartX, heartY + 5, 
    'F'
  );
  
  // Add title with elegant styling
  doc.setTextColor(242, 59, 108); // #F23B6C
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const title = "Personalized Obsession Trigger Plan";
  doc.text(title, pageWidth/2, margin + 2, { align: "center" });
  
  // Add decorative underline
  const titleWidth = doc.getTextWidth(title);
  doc.setDrawColor(242, 75, 124);
  doc.setLineWidth(0.75);
  doc.line(pageWidth/2 - titleWidth/2, margin + 4, pageWidth/2 + titleWidth/2, margin + 4);
  
  // Add subtitle with name
  doc.setTextColor(107, 114, 128); // gray-500
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Created exclusively for ${userData.firstName}`, pageWidth/2, margin + 10, { align: "center" });
  
  // Add a small decorative divider
  doc.setDrawColor(242, 205, 220);
  doc.setLineWidth(0.5);
  const dividerWidth = 40;
  doc.line(pageWidth/2 - dividerWidth/2, margin + 14, pageWidth/2 + dividerWidth/2, margin + 14);
  
  // Add the current date
  const formattedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(formattedDate, pageWidth/2, margin + 19, { align: "center" });
  
  // Add professional introduction box
  const introY = margin + 30;
  
  // Add subtle background for introduction
  doc.setFillColor(252, 246, 249); // Very light pink
  doc.roundedRect(margin - 2, introY - 3, contentWidth + 4, 20, 2, 2, 'F');
  
  // Add introduction text
  doc.setTextColor(31, 41, 55); // gray-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Based on your quiz answers, we've created this personalized relationship action plan designed to help you transform your connection with him. Follow these expert insights for best results.", 
    margin, 
    introY + 2,
    { 
      maxWidth: contentWidth,
      align: "left" 
    }
  );
  
  // Start content after the introduction box
  let yPosition = introY + 25;
  
  // Add content
  doc.setTextColor(31, 41, 55); // gray-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  // Clean HTML tags from advice and then process markdown-like advice text
  const cleanAdvice = stripHtmlTags(advice);
  
  // Process markdown to ensure proper formatting
  const formattedAdvice = cleanAdvice
    .replace(/#{2,3}\s+([^\n]+)/g, (_, header) => `\n\n## ${header}\n`) // Format headers
    .replace(/\*\*([^*]+)\*\*/g, (_, text) => text) // Clean bold markers but preserve text
    .replace(/^\d+\.\s+/gm, (match) => `\n${match}`) // Add newlines before numbered items
    .replace(/^\s*-\s+/gm, (match) => `\n• ${match.substring(2)}`) // Convert dashes to bullets
    .trim();
  
  // Split into sections with better formatting
  const sections = formattedAdvice.split('\n\n');
  
  // Helper function to draw a sparkle
  const drawSparkle = (x: number, y: number, size: number = 5) => {
    const halfSize = size / 2;
    
    // Draw sparkle
    doc.setDrawColor(242, 75, 124);
    doc.setLineWidth(0.5);
    
    // Vertical line
    doc.line(x, y - halfSize, x, y + halfSize);
    
    // Horizontal line
    doc.line(x - halfSize, y, x + halfSize, y);
    
    // Diagonal lines
    doc.line(x - halfSize * 0.7, y - halfSize * 0.7, x + halfSize * 0.7, y + halfSize * 0.7);
    doc.line(x - halfSize * 0.7, y + halfSize * 0.7, x + halfSize * 0.7, y - halfSize * 0.7);
  };
  
  // Helper function to draw a diamond
  const drawDiamond = (x: number, y: number, size: number = 6) => {
    doc.setFillColor(242, 75, 124);
    
    // Draw a simple square rotated 45 degrees instead
    doc.setLineWidth(0.5);
    
    // Draw a small filled circle instead of a diamond to avoid errors
    doc.circle(x, y, size/2, 'F');
  };
  
  for (const section of sections) {
    // Check if we need to add a page break
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      // Add page decoration to the new page
      addPageDecoration();
      yPosition = margin;
    }
    
    // Check if it's a header (starts with # or ##)
    if (section.startsWith('# ') || section.startsWith('## ') || section.startsWith('### ')) {
      const headerText = section.replace(/^#+\s/, '');
      
      // Add background styling for major headers for better visual organization
      if (section.startsWith('## ')) {
        // Create a subtle background for section headers
        doc.setFillColor(252, 240, 245); // Very light pink
        doc.roundedRect(margin - 5, yPosition - 7, contentWidth + 10, 15, 2, 2, 'F');
        
        // Add a small accent bar to the left
        doc.setFillColor(242, 75, 124); // #f24b7c
        doc.rect(margin - 5, yPosition - 7, 3, 15, 'F');
      }
      
      doc.setFontSize(section.startsWith('# ') ? 18 : section.startsWith('## ') ? 16 : 14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(242, 75, 124); // #f24b7c
      
      // Add diamond icon before some headers
      if (section.startsWith('## ') && !headerText.includes("How to Respond")) {
        drawDiamond(margin - 7, yPosition - 1);
      }
      
      const lines = doc.splitTextToSize(headerText, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 7 + 5; // Add more spacing after headers
      
      // Reset for normal text
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
    } 
    // Check if it's a list item (starts with number and period or * or - )
    else if (/^\d+\.\s/.test(section) || section.trim().startsWith('* ') || section.trim().startsWith('- ')) {
      const listText = section;
      doc.setFont("helvetica", "normal");
      
      // Add a light background behind list items for better readability
      if (/^\d+\.\s/.test(section)) {
        // Get approximate height
        const lines = doc.splitTextToSize(listText, contentWidth - 10);
        const itemHeight = lines.length * 6 + 2;
        
        // Add sparkle icon for numbered items
        drawSparkle(margin + 3, yPosition - 1, 4);
        
        // Add subtle highlight background
        doc.setFillColor(252, 246, 249);
        doc.roundedRect(margin, yPosition - 5, contentWidth - 5, itemHeight + 4, 1, 1, 'F');
      }
      
      const lines = doc.splitTextToSize(listText, contentWidth - 15);
      doc.text(lines, margin + 10, yPosition); // Increase indent for better readability
      yPosition += lines.length * 6 + 4; // Add more spacing after list items
    }
    // Regular paragraph
    else {
      // Process bold text
      let paragraph = section.replace(/\*\*(.*?)\*\*/g, "$1"); // Remove ** but remember positions
      
      // Create proper paragraph formatting
      const lines = doc.splitTextToSize(paragraph, contentWidth);
      
      // Add some visual enhancement to the first paragraph after a header
      if (sections.indexOf(section) > 0 && 
          (sections[sections.indexOf(section) - 1].startsWith('# ') || 
           sections[sections.indexOf(section) - 1].startsWith('## '))) {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(70, 70, 80); // Darker gray for first paragraph
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 70); // Standard text color
      }
      
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 6 + 5; // Add more spacing after paragraphs
    }
  }
  
  // Check if we need a new page for the CTA box
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    // Add page decoration to the new page
    addPageDecoration();
    yPosition = margin;
  }
  
  // Next Steps section before CTA
  doc.setTextColor(242, 75, 124); // #f24b7c
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Next Steps", margin, yPosition);
  yPosition += 8;
  
  // Next steps advice
  doc.setTextColor(31, 41, 55); // gray-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  const nextStepsText = [
    "Apply these techniques for the next 2-3 weeks, and you'll likely notice a shift in his behavior pattern.",
    "Remember that a man who truly values you will work to keep you in his life.",
    "Remember: You deserve someone who recognizes your worth consistently, not just when it's convenient for them."
  ];
  
  for (const step of nextStepsText) {
    const lines = doc.splitTextToSize(step, contentWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 6 + 2;
  }
  
  yPosition += 5;
  
  // Draw a prominent visual call-to-action box
  const ctaY = yPosition;
  
  // Create a more professional gradient-like effect for the CTA box
  // First draw gradient-like background (using multiple rectangles)
  const gradientSteps = 6;
  const gradientHeight = 50; // Make box taller for more impact
  
  // Create main box with border
  doc.setFillColor(252, 231, 243); // Light pink base #fce7f3
  doc.setDrawColor(242, 75, 124); // #f24b7c border color
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, ctaY, contentWidth, gradientHeight, 4, 4, 'FD');
  
  // Add decorative elements
  // Top accent bar
  doc.setFillColor(242, 75, 124); // #f24b7c 
  doc.rect(margin, ctaY, contentWidth, 2, 'F');
  
  // Add small decorative hearts in the corners
  const drawSmallHeart = (x: number, y: number, size: number = 3) => {
    // Left half of heart
    doc.circle(x - size/3, y, size/3, 'F');
    // Right half of heart
    doc.circle(x + size/3, y, size/3, 'F');
    // Bottom triangle of heart
    doc.triangle(
      x - size/2, y, 
      x + size/2, y, 
      x, y + size/2, 
      'F'
    );
  };
  
  // Draw decorative hearts in the corners
  doc.setFillColor(242, 75, 124); // #f24b7c
  drawSmallHeart(margin + 8, ctaY + 8, 4);
  drawSmallHeart(margin + contentWidth - 8, ctaY + 8, 4);
  
  // Add heading with better typography
  doc.setTextColor(242, 75, 124); // #f24b7c
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("To learn the full system that activates his Hero Instinct:", margin + 12, ctaY + 14);
  
  // Add program name in larger text with more prominence
  doc.setTextColor(242, 75, 124); // #f24b7c
  doc.setFontSize(20); // Larger size for emphasis
  doc.setFont("helvetica", "bold");
  const programName = "His Secret Obsession";
  
  // Center the program name
  const programWidth = doc.getTextWidth(programName);
  doc.text(programName, pageWidth/2, ctaY + 28, { align: "center" });
  
  // Draw decorative underline
  doc.setDrawColor(242, 75, 124);
  doc.setLineWidth(0.75);
  doc.line(
    pageWidth/2 - programWidth/2, 
    ctaY + 30, 
    pageWidth/2 + programWidth/2, 
    ctaY + 30
  );
  
  // Add call-to-action text
  doc.setTextColor(70, 70, 80);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Click here to download now", pageWidth/2, ctaY + 38, { align: "center" });
  
  // Add a small arrow icon to suggest action
  doc.setFillColor(242, 75, 124);
  const arrowX = pageWidth/2 + doc.getTextWidth("Click here to download now")/2 + 10;
  doc.triangle(
    arrowX, ctaY + 38,
    arrowX + 5, ctaY + 36,
    arrowX, ctaY + 40,
    'F'
  );
  
  // Make the entire box clickable with affiliate link
  doc.link(margin, ctaY, contentWidth, gradientHeight, { url: affiliateLink });
  
  // Add footer
  doc.setTextColor(107, 114, 128); // gray-500
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const footerText = `Generated by Obsession Trigger AI on ${formattedDate}`;
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
  
  return doc;
};

export const downloadPDF = (doc: jsPDF, userName: string): void => {
  doc.save(`Obsession_Trigger_Plan_${userName}.pdf`);
};

export const getPDFDataUrl = (doc: jsPDF): string => {
  return doc.output('datauristring');
};
