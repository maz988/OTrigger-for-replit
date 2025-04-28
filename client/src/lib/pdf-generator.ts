import { jsPDF } from "jspdf";
import { QuizFormData, EmailFormData } from "@shared/schema";
// Import image addImage plugin
import 'jspdf-autotable';

// Base64 encoded heart icon for PDF
const HEART_ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmMjRiN2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1oZWFydCI+PHBhdGggZD0iTTIwLjg0IDQuNjFhNS41IDUuNSAwIDAgMC03LjcgMEwxMiA1LjY3bC0xLjE0LTEuMDZhNS41IDUuNSAwIDAgMC03Ljc4IDcuNzhsMS4wNiAxLjA2TDEyIDIxLjIzbDcuODYtNy43OGwxLjA2LTEuMDZhNS41IDUuNSAwIDAgMCAwLTcuNzh6IiBmaWxsPSIjZmJiNWM4Ii8+PC9zdmc+";

const DIAMOND_ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmMjRiN2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1kaWFtb25kIj48cGF0aCBkPSJNMTYgMkg4TDMgOGw5IDEzbDktMTNMMTYgMnoiIGZpbGw9IiNmYmI1YzgiLz48L3N2Zz4=";

const SPARKLE_ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmMjRiN2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1zcGFya2xlcyI+PHBhdGggZD0iTTEyIDNWNSIgZmlsbD0iI2ZiYjVjOCIvPjxwYXRoIGQ9Ik0xOSA5aC0yIiBmaWxsPSIjZmJiNWM4Ii8+PHBhdGggZD0iTTEyIDE5djIiIGZpbGw9IiNmYmI1YzgiLz48cGF0aCBkPSJNNyA5SDUiIGZpbGw9IiNmYmI1YzgiLz48cGF0aCBkPSJtMTYuOTUgMTYgLjYgMiIgZmlsbD0iI2ZiYjVjOCIvPjxwYXRoIGQ9Im0zLjUgMTQuMTUgMS45LjYiIGZpbGw9IiNmYmI1YzgiLz48cGF0aCBkPSJtMTYuNiA2IDE1LTEuNCIgZmlsbD0iI2ZiYjVjOCIvPjxwYXRoIGQ9Im0zLjUgOS44NS45LjMiIGZpbGw9IiNmYmI1YzgiLz48L3N2Zz4=";

// Relationship graphics
const COUPLE_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjAwIDEwMCI+PHBhdGggZD0iTTcwLDIwYzE1LDAsMTUsMjAsMCwyMHMtMTUtMjAsMC0yMFoiIGZpbGw9IiNmMjRiN2MiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0xMzAsMjBjMTUsMCwxNSwyMCwwLDIwcy0xNS0yMCwwLTIwWiIgZmlsbD0iI2YyNGI3YyIgb3BhY2l0eT0iMC4yIi8+PHBhdGggZD0iTTcwLDQwbC01LDQwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik03MCw0MGwxMCw0MCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTMwLDQwbC01LDQwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0xMzAsNDBsMTAsNDAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTEwMCw1MEM5MCw2MCw3MCw1MCw2NSwzNWMtNSwyMCw1LDMwLDI1LDMwczMwLTEwLDI1LTMwQzExMCw1MCw5MCw2MCw4MCw1MHoiIGZpbGw9IiNmMjRiN2MiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==";

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
  
  // Add heart icon
  try {
    const img = new Image();
    img.src = HEART_ICON;
    doc.addImage(HEART_ICON, 'SVG', pageWidth - margin - 10, margin - 10, 10, 10);
  } catch (e) {
    console.error('Error adding heart icon:', e);
  }
  
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
  
  // Add couple illustration
  try {
    doc.addImage(COUPLE_IMAGE, 'SVG', pageWidth / 2 - 25, margin + 22, 50, 25);
  } catch (e) {
    console.error('Error adding couple image:', e);
  }
  
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
        try {
          doc.addImage(DIAMOND_ICON, 'SVG', margin - 10, yPosition - 5, 8, 8);
        } catch (e) {
          console.error('Error adding diamond icon:', e);
        }
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
        try {
          doc.addImage(SPARKLE_ICON, 'SVG', margin, yPosition - 4, 5, 5);
        } catch (e) {
          console.error('Error adding sparkle icon:', e);
        }
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
  
  // Add call to action box with pink background
  const ctaY = yPosition + 5;
  doc.setFillColor(252, 231, 243); // Light pink #fce7f3
  doc.setDrawColor(242, 75, 124); // #f24b7c
  doc.roundedRect(margin, ctaY, contentWidth, 25, 3, 3, 'FD');
  
  // Add CTA text
  doc.setTextColor(31, 41, 55); // gray-800
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("To learn the full system that activates his Hero Instinct, download:", margin + 5, ctaY + 8);
  
  doc.setTextColor(242, 75, 124); // #f24b7c
  doc.setFontSize(14);
  doc.text("His Secret Obsession", margin + 5, ctaY + 16);
  
  doc.setTextColor(242, 75, 124); // #f24b7c
  doc.setFontSize(11);
  doc.text("Click here!", margin + 5, ctaY + 22);
  
  // Add hidden link annotation (not visible in the text but clickable)
  doc.link(margin + 5, ctaY + 16, 80, 10, { url: affiliateLink });
  
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
