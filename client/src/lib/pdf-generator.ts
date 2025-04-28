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
  
  // Function to add stylish page decoration with elegant borders and accents
  const addPageDecoration = () => {
    // Add decorative header and footer background
    const gradientColors = [
      [252, 231, 243], // light pink #fce7f3
      [253, 237, 246], // lighter pink
      [254, 242, 250]  // very light pink
    ];
    
    // Top gradient header
    const headerHeight = 30;
    const headerColor = gradientColors[0];
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Bottom gradient footer
    const footerHeight = 20;
    const footerColor = gradientColors[0];
    doc.setFillColor(footerColor[0], footerColor[1], footerColor[2]);
    doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
    
    // Add decorative curve at the bottom of the header
    doc.setFillColor(255, 255, 255);
    for (let i = 0; i < pageWidth; i += 20) {
      const arcWidth = 20;
      const arcHeight = 5;
      doc.ellipse(i + (arcWidth/2), headerHeight, arcWidth/2, arcHeight, 'F');
    }
    
    // Add decorative horizontal line at bottom of header
    doc.setDrawColor(242, 180, 210);
    doc.setLineWidth(0.5);
    doc.line(0, headerHeight + 1, pageWidth, headerHeight + 1);
    
    // Add decorative border pattern on sides
    const patternHeight = 5;
    const sideBarWidth = 6;
    
    // Left border decoration
    doc.setFillColor(254, 242, 250); // Very light pink
    doc.rect(0, headerHeight, sideBarWidth, pageHeight - headerHeight - footerHeight, 'F');
    
    // Right border decoration
    doc.rect(pageWidth - sideBarWidth, headerHeight, sideBarWidth, pageHeight - headerHeight - footerHeight, 'F');
    
    // Add decorative dots in the side borders
    doc.setFillColor(242, 180, 210, 0.5);
    for (let y = headerHeight + 20; y < pageHeight - footerHeight; y += 40) {
      // Left side dot
      doc.circle(sideBarWidth/2, y, 1.5, 'F');
      // Right side dot
      doc.circle(pageWidth - sideBarWidth/2, y, 1.5, 'F');
    }
    
    // Add small decorative hearts in footer
    const drawSmallFooterHeart = (x: number, y: number, size: number = 2) => {
      doc.setFillColor(242, 180, 210, 0.6);
      // Left half of heart
      doc.circle(x - size/4, y, size/4, 'F');
      // Right half of heart
      doc.circle(x + size/4, y, size/4, 'F');
      // Bottom triangle
      doc.triangle(
        x - size/3, y, 
        x + size/3, y, 
        x, y + size/3, 
        'F'
      );
    };
    
    // Add decorative hearts in footer
    drawSmallFooterHeart(pageWidth/4, pageHeight - footerHeight/2, 3);
    drawSmallFooterHeart(pageWidth*3/4, pageHeight - footerHeight/2, 3);
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
  
  // Create a more elegant header design
  
  // Add curved decorative accent at the top
  doc.setFillColor(242, 75, 124, 0.7); // Light pink with transparency
  doc.roundedRect(pageWidth/2 - 65, margin - 10, 130, 3, 1, 1, 'F');
  
  // Add small hearts flanking the title
  const drawDecoHeart = (x: number, y: number, size: number = 3) => {
    doc.setFillColor(242, 75, 124, 0.8);
    // Left half of heart
    doc.circle(x - size/4, y, size/4, 'F');
    // Right half of heart
    doc.circle(x + size/4, y, size/4, 'F');
    // Bottom triangle
    doc.triangle(
      x - size/3, y, 
      x + size/3, y, 
      x, y + size/3, 
      'F'
    );
  };
  
  // Add decorative hearts
  drawDecoHeart(pageWidth/2 - 70, margin - 8, 4);
  drawDecoHeart(pageWidth/2 + 70, margin - 8, 4);
  
  // Add main title with elegant styling
  doc.setTextColor(242, 59, 108); // #F23B6C
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  const title = "Your Personalized Plan";
  doc.text(title, pageWidth/2, margin + 2, { align: "center" });
  
  // Add subtitle (Obsession Trigger)
  doc.setTextColor(242, 100, 140);
  doc.setFontSize(14);
  doc.setFont("helvetica", "italic");
  doc.text("OBSESSION TRIGGER", pageWidth/2, margin - 6, { align: "center" });
  
  // Add decorative underline with gradient effect
  const titleWidth = doc.getTextWidth(title);
  const underlineY = margin + 4;
  
  // Draw main underline
  doc.setDrawColor(242, 75, 124);
  doc.setLineWidth(0.75);
  doc.line(pageWidth/2 - titleWidth/2, underlineY, pageWidth/2 + titleWidth/2, underlineY);
  
  // Draw small accent lines for decorative effect
  doc.setLineWidth(0.5);
  doc.setDrawColor(242, 75, 124, 0.7);
  doc.line(pageWidth/2 - titleWidth/2 - 10, underlineY + 1.5, pageWidth/2 + titleWidth/2 + 10, underlineY + 1.5);
  doc.setDrawColor(242, 75, 124, 0.4);
  doc.line(pageWidth/2 - titleWidth/2 - 15, underlineY + 3, pageWidth/2 + titleWidth/2 + 15, underlineY + 3);
  
  // Add personalized subtitle with name
  doc.setTextColor(107, 114, 128); // gray-500
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text(`Created exclusively for ${userData.firstName}`, pageWidth/2, margin + 10, { align: "center" });
  
  // Add a small decorative divider
  doc.setDrawColor(242, 205, 220);
  doc.setLineWidth(0.5);
  const dividerWidth = 50;
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
  
  // Add professional introduction box with enhanced design
  const introY = margin + 30;
  
  // Create a more elegant introduction box
  // Main background
  doc.setFillColor(252, 246, 249); // Very light pink
  doc.roundedRect(margin - 3, introY - 4, contentWidth + 6, 24, 3, 3, 'F');
  
  // Add subtle border
  doc.setDrawColor(242, 180, 210, 0.6);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin - 3, introY - 4, contentWidth + 6, 24, 3, 3, 'S');
  
  // Add decorative accent
  doc.setFillColor(242, 180, 210, 0.3);
  doc.rect(margin - 3, introY - 4, contentWidth + 6, 2, 'F');
  
  // Add small quote marks to give it a testimonial feeling
  doc.setFillColor(242, 180, 210, 0.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  
  // Quote marks - using proper function signature with strings first, coordinates second
  doc.text("\"", margin, introY + 2); 
  doc.text("\"", margin + contentWidth - 4, introY + 2);
  
  // Add introduction text with better typography
  doc.setTextColor(80, 80, 95); // Slightly darker for better readability
  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  
  const introText = "Based on your quiz answers, we've created this personalized relationship action plan designed to help you transform your connection with him. Follow these expert insights for best results.";
  
  // Position text with proper margins to account for quote marks
  doc.text(
    introText, 
    margin + 8, // Indented to make room for quote mark
    introY + 4,  // Better vertical positioning
    { 
      maxWidth: contentWidth - 16, // Narrower to account for quote marks
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
  
  // Process and clean up the AI-generated markdown content
  // First, simplify the content structure by normalizing with consistent line breaks
  let formattedAdvice = cleanAdvice
    // Clean up any existing repeated formatting
    .replace(/#{1,}(?=#{1,})/g, '')
    .replace(/(\n\s*){3,}/g, '\n\n')
    .replace(/^[\s\n]*/, '')
    .trim();
    
  // Now extract the main components - we'll rebuild in a consistent structure
  
  // Extract the personalized plan intro if it exists
  let planIntro = "";
  const planIntroMatch = formattedAdvice.match(/Your Personalized Obsession Trigger Plan[^#]*/i);
  if (planIntroMatch) {
    planIntro = planIntroMatch[0].trim();
    formattedAdvice = formattedAdvice.replace(planIntroMatch[0], '');
  }
  
  // Extract the understanding section if it exists
  let understandingSection = "";
  const understandingMatch = formattedAdvice.match(/(?:#{1,}\s*)?Understanding His Behavior[^#]*/i);
  if (understandingMatch) {
    understandingSection = understandingMatch[0].trim();
    formattedAdvice = formattedAdvice.replace(understandingMatch[0], '');
  }
  
  // Extract the how to respond section if it exists
  let respondSection = "";
  const respondMatch = formattedAdvice.match(/(?:#{1,}\s*)?How to Respond[^#]*/i);
  if (respondMatch) {
    respondSection = respondMatch[0].trim();
    formattedAdvice = formattedAdvice.replace(respondMatch[0], '');
  }
  
  // Extract the next steps section if it exists
  let nextStepsSection = "";
  const nextStepsMatch = formattedAdvice.match(/(?:#{1,}\s*)?Next Steps[^#]*/i);
  if (nextStepsMatch) {
    nextStepsSection = nextStepsMatch[0].trim();
    formattedAdvice = formattedAdvice.replace(nextStepsMatch[0], '');
  }
  
  // Now rebuild with proper formatting
  formattedAdvice = "";
  
  // Add the plan intro
  if (planIntro) {
    formattedAdvice += planIntro.trim() + "\n\n";
  }
  
  // Add the understanding section with proper header
  if (understandingSection) {
    formattedAdvice += "## Understanding His Behavior\n" + 
      understandingSection.replace(/^(?:#{1,}\s*)?Understanding His Behavior/i, '').trim() + "\n\n";
  }
  
  // Add the how to respond section with proper header
  if (respondSection) {
    formattedAdvice += "## How to Respond Effectively\n" + 
      respondSection.replace(/^(?:#{1,}\s*)?How to Respond/i, '').trim() + "\n\n";
      
    // Process the numbered strategies in the respond section
    for (let i = 1; i <= 5; i++) {
      const strategy = new RegExp(`${i}\\.\\s+([^\\n]+(?:\\n(?!\\d+\\.).*?)*)`, 'g');
      formattedAdvice = formattedAdvice.replace(strategy, (match, content) => {
        return `\n${i}. ${content.trim()}\n`;
      });
    }
  }
  
  // Add the next steps section with proper header
  if (nextStepsSection) {
    formattedAdvice += "## Next Steps\n" + 
      nextStepsSection.replace(/^(?:#{1,}\s*)?Next Steps/i, '').trim() + "\n\n";
  }
  
  // Clean up any remaining inconsistencies
  formattedAdvice = formattedAdvice
    // Clean bold markers but preserve text
    .replace(/\*\*([^*]+)\*\*/g, (_, text) => text)
    // Normalize bullet points
    .replace(/^\s*-\s+/gm, (match) => `\n• ${match.substring(2)}`)
    // Clean up excessive newlines
    .replace(/(\n\s*){3,}/g, '\n\n')
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
  
  // Add professional footer with logo and copyright
  const footerY = pageHeight - 12;
  
  // Add centered footer text
  doc.setTextColor(107, 114, 128); // gray-500
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const footerText = `Generated by Obsession Trigger AI on ${formattedDate}`;
  doc.text(footerText, pageWidth / 2, footerY, { align: "center" });
  
  // Add copyright notice
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 140);
  const copyright = "© " + new Date().getFullYear() + " Obsession Trigger | Your Relationship Success Guide";
  doc.text(copyright, pageWidth / 2, footerY + 5, { align: "center" });
  
  // Add small logo in footer
  const logoSize = 3;
  doc.setFillColor(242, 75, 124, 0.7);
  doc.circle(pageWidth / 2 - 55, footerY, logoSize, 'F');
  doc.setFillColor(255, 255, 255, 0.9);
  doc.circle(pageWidth / 2 - 55, footerY, logoSize - 1.2, 'F');
  
  // Draw small T beside the O
  doc.setFillColor(242, 75, 124, 0.7);
  doc.rect(pageWidth / 2 - 51, footerY - 2, 3, 1, 'F');
  doc.rect(pageWidth / 2 - 50, footerY - 2, 1, 4, 'F');
  
  return doc;
};

export const downloadPDF = (doc: jsPDF, userName: string): void => {
  doc.save(`Obsession_Trigger_Plan_${userName}.pdf`);
};

export const getPDFDataUrl = (doc: jsPDF): string => {
  return doc.output('datauristring');
};
