import jsPDF from 'jspdf';
// Import autotable correctly as a default import and then add the plugin
import autoTable from 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { Invoice } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import fs from 'fs';
import path from 'path';

// Extended interfaces for jsPDF with autoTable additions
interface AutoTableResult {
  finalY: number;
}

interface JsPDFInternal {
  getNumberOfPages: () => number;
}

interface JsPDFExtended extends jsPDF {
  lastAutoTable?: AutoTableResult;
  internal: JsPDFInternal & jsPDF['internal'];
  setGlobalAlpha: (alpha: number) => jsPDF;
  setFillOpacity: (opacity: number) => jsPDF;
  saveGraphicsState: () => jsPDF;
  restoreGraphicsState: () => jsPDF;
}

/**
 * Generates a PDF for a given invoice
 * 
 * @param invoice - The invoice data to generate a PDF for
 * @returns ArrayBuffer containing the PDF data
 */
export function generateInvoicePDF(invoice: Invoice): ArrayBuffer {
  // Validate invoice data to prevent errors
  if (!invoice) {
    throw new Error('Invoice data is missing');
  }
  
  // Ensure required properties exist
  if (!invoice.invoiceNumber) {
    throw new Error('Invoice number is missing');
  }
  
  // Create safe references to avoid null pointer errors
  const seller = invoice.seller || { name: 'Unknown', email: 'Unknown' };
  const client = invoice.client || { name: 'Unknown', email: 'Unknown' };
  const items = invoice.items || [];
  const totalPrice = Number(invoice.totalPrice || 0);
  const createdAt = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
  
  // Define colors matching your web app style - using tuples for type safety
  const primaryColor: [number, number, number] = [64, 123, 255]; // Blue
  const secondaryColor: [number, number, number] = [82, 82, 91]; // Zinc/gray
  const backgroundColor: [number, number, number] = [249, 250, 251]; // Light background
  
  // Create PDF with A4 format
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  }) as JsPDFExtended;
  
  try {
    // White background for the entire document
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Logo size and position for the image
    const logoWidth = 20; // smaller logo size
    const logoHeight = 20;
    const logoX = 20; // position at left margin
    const logoY = 20; // top position
    
    try {
      // Use the custom logo image data URL
      const logoBase64 = 'data:image/png;base64,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';
      
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (imageError) {
      console.error('Error loading logo image:', imageError);
      // Fallback to drawing simple placeholder if image fails to load
      doc.setFillColor(0, 0, 0);
      doc.circle(logoX + (logoWidth/2), logoY + (logoHeight/2), 5, 'F'); 
    }
    
    // Add CAMPUS MARKET text next to the logo on the same line
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text('CAMPUS MARKET', logoX + logoWidth + 10, logoY + 15); // Position text vertically centered with logo
    
    // Add invoice information - more similar to web layout
    const leftMargin = 20;
    const rightColumnX = 120;
    
    // Add invoice details
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    
    // Invoice number section
    doc.setFontSize(11);
    doc.text('Invoice Number', leftMargin, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${invoice.invoiceNumber}`, leftMargin, 57);
    doc.setFont('helvetica', 'normal');
    
    // Date section - aligned to right like in web
    doc.setFontSize(11);
    doc.text('Date Issued', rightColumnX, 50);
    doc.setFontSize(12);
    doc.text(`${formatDateTime(invoice.createdAt)}`, rightColumnX, 57);
    
    // Add client/seller information with better styling - similar to web layout
    const boxY = 70;
    const boxHeight = 40;
    
    // Add client/seller information with better styling (no boxes)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('From (Seller):', leftMargin, boxY);
    doc.text('To (Client):', rightColumnX, boxY);
    doc.setFont('helvetica', 'normal');
    
    doc.setFontSize(10);
    doc.text(`${seller.name}`, leftMargin, boxY + 10);
    doc.text(`${seller.email}`, leftMargin, boxY + 17);
    
    doc.text(`${client.name}`, rightColumnX, boxY + 10);
    doc.text(`${client.email}`, rightColumnX, boxY + 17);
    
    // Add line items section 
    const itemsY = boxY + boxHeight;
    
    // Prepare custom column headers with larger text for the table
    const tableColumn = ["Item", "Price"];
    
    // Prepare table data
    const tableRows: (string | number)[][] = [];
    
    if (items.length > 0) {
      items.forEach(item => {
        const itemData = [
          item.name || 'Unnamed Item',
          formatCurrency(Number(item.price || 0))
        ];
        tableRows.push(itemData);
      });
    } else {
      // Add a placeholder row if no items exist
      tableRows.push(['No items', formatCurrency(0)]);
    }
    
    // Use autoTable with better styling - all white background
    autoTable(doc, {
      startY: itemsY + 5,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: 'bold',
        fontSize: 14, // Larger font size for headers
        halign: 'left',
        cellPadding: {top: 5, right: 0, bottom: 5, left: 0}, // Remove padding
        lineWidth: 0, // No border
        lineColor: [255, 255, 255] // White "border" (invisible)
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [50, 50, 50],
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 120 },        // Item name - wider now
        1: { cellWidth: 40, halign: 'right' } // Price - right aligned
      },
      margin: { top: itemsY + 10, left: leftMargin, right: 20 },
      tableWidth: 'auto',
      styles: {
        overflow: 'linebreak',
        cellPadding: 5,
        lineColor: [240, 240, 240] // Light gray lines between rows
      },
      didDrawCell: function(data) {
        // Add only a bottom border below the header row
        if (data.row.index === 0 && data.section === 'head') {
          const { x, y, width } = data.cell;
          doc.setDrawColor(0, 0, 0); // Black color for the separator
          doc.setLineWidth(1); // Thicker line
          doc.line(leftMargin, y + data.cell.height, leftMargin + 160, y + data.cell.height);
          doc.setLineWidth(0.2); // Reset line width
        }
      }
    });
    
    // Get final Y position from the last table
    const finalY = (doc as JsPDFExtended).lastAutoTable?.finalY || 120;
    
    // Add total without a border - just text
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 135, finalY + 14);
    doc.text(`${formatCurrency(totalPrice)}`, 185, finalY + 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    // Add footer with website and page numbers
    const pageCount = (doc as JsPDFExtended).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, 190, 287, { align: 'right' });
    }
    
    return doc.output('arraybuffer');
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 
