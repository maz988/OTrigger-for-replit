import { jsPDF } from "jspdf";
import { QuizFormData, EmailFormData } from "@shared/schema";
// Import autotable plugin for better formatting
import 'jspdf-autotable';

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
  
  // Add decorative header background
  doc.setFillColor(252, 231, 243); // light pink #fce7f3
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Draw a heart directly instead of using SVG image
  const heartX = pageWidth - margin - 10;
  const heartY = margin;
  
  // Draw heart shape
  doc.setDrawColor(242, 75, 124); // #f24b7c
  doc.setFillColor(242, 75, 124); // #f24b7c
  doc.setLineWidth(0.5);
  
  // Left half of heart
  doc.circle(heartX, heartY, 3, 'F');
  // Right half of heart
  doc.circle(heartX + 6, heartY, 3, 'F');
  // Bottom triangle of heart
  doc.triangle(
    heartX - 3, heartY, 
    heartX + 9, heartY, 
    heartX + 3, heartY + 6, 
    'F'
  );
  
  // Add title with pink color
  doc.setTextColor(242, 59, 108); // #F23B6C
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Your Custom Obsession Trigger Plan", margin, margin + 5);
  
  // Add subtitle
  doc.setTextColor(107, 114, 128); // gray-500
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Prepared specially for ${userData.firstName}`, margin, margin + 12);
  
  // Add divider
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.line(margin, margin + 18, pageWidth - margin, margin + 18);
  
  // Draw relationship illustration box
  const coupleX = pageWidth / 2;
  const coupleY = margin + 30;
  
  // Background box for illustration
  doc.setFillColor(252, 231, 243); // Light pink #fce7f3
  doc.roundedRect(coupleX - 20, coupleY - 10, 40, 25, 2, 2, 'F');
  
  // Hearts for the illustration
  doc.setFillColor(242, 75, 124); // #f24b7c
  
  // Left heart
  doc.circle(coupleX - 10, coupleY, 3, 'F');
  doc.circle(coupleX - 5, coupleY, 3, 'F');
  doc.triangle(
    coupleX - 13, coupleY, 
    coupleX - 2, coupleY, 
    coupleX - 7.5, coupleY + 5, 
    'F'
  );
  
  // Right heart
  doc.circle(coupleX + 5, coupleY, 3, 'F');
  doc.circle(coupleX + 10, coupleY, 3, 'F');
  doc.triangle(
    coupleX + 2, coupleY, 
    coupleX + 13, coupleY, 
    coupleX + 7.5, coupleY + 5, 
    'F'
  );
  
  // Text for illustration
  doc.setTextColor(242, 75, 124); // #f24b7c
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Understanding Relationships", coupleX, coupleY + 10, { align: "center" });
  
  // Start content after the image
  let yPosition = margin + 55;
  
  // Add introduction
  doc.setTextColor(31, 41, 55); // gray-800
  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.text("Based on your quiz answers, we've created this personalized plan just for you.", margin, yPosition);
  yPosition += 10;
  
  // Add content
  doc.setTextColor(31, 41, 55); // gray-800
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  // Process markdown-like advice text
  const sections = advice.split('\n\n');
  
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
      yPosition = margin;
    }
    
    // Check if it's a header (starts with # or ##)
    if (section.startsWith('# ') || section.startsWith('## ') || section.startsWith('### ')) {
      const headerText = section.replace(/^#+\s/, '');
      doc.setFontSize(section.startsWith('# ') ? 18 : section.startsWith('## ') ? 16 : 14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(242, 75, 124); // #f24b7c
      
      // Add diamond icon before main headers
      if (section.startsWith('## ') && !headerText.includes("How to Respond")) {
        drawDiamond(margin - 7, yPosition - 1);
      }
      
      const lines = doc.splitTextToSize(headerText, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 7 + 3;
      
      // Reset for normal text
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
    } 
    // Check if it's a list item (starts with number and period or * or - )
    else if (/^\d+\.\s/.test(section) || section.trim().startsWith('* ') || section.trim().startsWith('- ')) {
      const listText = section;
      doc.setFont("helvetica", "normal");
      
      // Add sparkle icon for numbered items
      if (/^\d+\.\s/.test(section)) {
        drawSparkle(margin + 3, yPosition - 1, 4);
      }
      
      const lines = doc.splitTextToSize(listText, contentWidth - 10);
      doc.text(lines, margin + 8, yPosition); // Indent list items
      yPosition += lines.length * 6 + 3;
    }
    // Regular paragraph
    else {
      // Process bold text
      let paragraph = section.replace(/\*\*(.*?)\*\*/g, "$1"); // Remove ** but remember positions
      
      const lines = doc.splitTextToSize(paragraph, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 6 + 4; // Add spacing between paragraphs
    }
  }
  
  // Check if we need a new page for the CTA box
  if (yPosition > pageHeight - 60) {
    doc.addPage();
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
  
  // Create a pink box with border
  doc.setFillColor(252, 231, 243); // Light pink #fce7f3
  doc.setDrawColor(242, 75, 124); // #f24b7c
  doc.roundedRect(margin, ctaY, contentWidth, 40, 3, 3, 'FD');
  
  // Draw a decorative line at the top
  doc.setDrawColor(242, 75, 124);
  doc.setLineWidth(1);
  doc.line(margin + 5, ctaY + 3, margin + contentWidth - 5, ctaY + 3);
  
  // Add heading in pink
  doc.setTextColor(242, 75, 124); // #f24b7c
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("To learn the full system that activates his Hero Instinct, download:", margin + 5, ctaY + 12);
  
  // Add program name in larger text
  doc.setTextColor(242, 75, 124); // #f24b7c
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const programName = "His Secret Obsession";
  doc.text(programName, margin + 5, ctaY + 22);
  
  // Draw a decorative underline
  doc.setDrawColor(242, 75, 124);
  doc.setLineWidth(0.5);
  const textWidth = doc.getTextWidth(programName);
  doc.line(margin + 5, ctaY + 24, margin + 5 + textWidth, ctaY + 24);
  
  // Add small label
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("(Click to download)", margin + 5, ctaY + 30);
  
  // Make the entire box clickable with affiliate link
  doc.link(margin, ctaY, contentWidth, 40, { url: affiliateLink });
  
  // Add footer
  doc.setTextColor(107, 114, 128); // gray-500
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const footerText = `Generated by Obsession Trigger AI on ${currentDate}`;
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
  
  return doc;
};

export const downloadPDF = (doc: jsPDF, userName: string): void => {
  doc.save(`Obsession_Trigger_Plan_${userName}.pdf`);
};

export const getPDFDataUrl = (doc: jsPDF): string => {
  return doc.output('datauristring');
};
