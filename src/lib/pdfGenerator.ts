// src/lib/pdfGenerator.ts

import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../data/data';
import type { PriceBreakdown } from '../data/data';

// A standardized type for the PDF generator
// This allows it to work for both the confirmation page and bookings page
type PdfBookingData = {
  booking_reference: string;
  check_in: string;
  check_out: string;
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown; // Use the existing PriceBreakdown type
  hotels: {
    name: string;
    address: { street: string; city: string };
  } | null;
};

/**
 * Generates a production-ready PDF receipt for a booking.
 */
export const downloadBookingPDF = (booking: PdfBookingData) => {
  const hotel = booking.hotels;
  if (!hotel) {
    alert('Cannot download receipt: Hotel data is missing.');
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 0;

  const brandColor = '#0d6efd'; // Your app's theme color
  const textColor = '#333333';
  const lightTextColor = '#666666';
  const borderColor = '#DDDDDD';

  // --- 1. Header ---
  doc.setFillColor(brandColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#FFFFFF');
  doc.text('ProBooker', margin, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Booking Receipt', pageWidth - margin, 25, { align: 'right' });

  currentY = 60; // Starting Y after header

  // --- 2. Title & Reference ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor);
  doc.text('Booking Confirmed!', margin, currentY);
  currentY += 10;

  doc.setFontSize(10);
  doc.setTextColor(lightTextColor);
  doc.text('Thank you for your booking. Here is a summary of your reservation.', margin, currentY);
  currentY += 15;

  doc.setFillColor('#F8F9FA');
  doc.setDrawColor(borderColor);
  doc.roundedRect(margin, currentY, contentWidth, 16, 3, 3, 'FD');
  doc.setFontSize(12);
  doc.setTextColor(textColor);
  doc.text('Booking Reference:', margin + 10, currentY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.booking_reference, pageWidth - margin - 10, currentY + 10, { align: 'right' });

  currentY += 30; // Space after ref box

  // --- 3. Booking Details (2-Column Layout) ---
  const leftColX = margin;
  const rightColX = margin + (contentWidth / 2) + 10;
  const colWidth = (contentWidth / 2) - 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor);
  doc.text('Reservation Details', leftColX, currentY);
  
  // Align the payment title with the reservation title
  doc.text('Payment Summary', rightColX, currentY);
  currentY += 8;

  doc.setDrawColor(borderColor);
  doc.line(margin, currentY, pageWidth - margin, currentY); // Horizontal line
  currentY += 10;

  // --- Left Column ---
  doc.setFontSize(10);
  doc.setTextColor(lightTextColor);
  doc.text('Hotel', leftColX, currentY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  doc.text(hotel.name, leftColX, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(lightTextColor);
  doc.text(`${hotel.address.street}, ${hotel.address.city}`, leftColX, currentY + 11);
  
  const leftColYEnd = currentY + 25; // Save Y position for later

  // --- Right Column (Price Breakdown) ---
  let rightColY = currentY;
  
  doc.setFontSize(10);
  doc.setTextColor(lightTextColor);
  doc.text('Room Subtotal', rightColX, rightColY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  doc.text(formatCurrency(booking.price_breakdown.subtotal), rightColX + colWidth, rightColY, { align: 'right' });
  rightColY += 10;

  doc.setFontSize(10);
  doc.setTextColor(lightTextColor);
  doc.text('Taxes & Fees', rightColX, rightColY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  const taxesAndFees = (booking.price_breakdown.taxes || 0) + (booking.price_breakdown.service_fee || 0);
  doc.text(formatCurrency(taxesAndFees), rightColX + colWidth, rightColY, { align: 'right' });
  
  const rightColYEnd = rightColY + 15; // Save Y position

  // --- Continue Left Column ---
  currentY = leftColYEnd; // Resume Y from where the hotel info ended
  
  doc.setFontSize(10);
  doc.setTextColor(lightTextColor);
  doc.text('Check-in', leftColX, currentY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  doc.text(format(parseISO(booking.check_in), 'EEE, dd MMM yyyy'), leftColX, currentY + 6);
  currentY += 15;

  doc.setFontSize(10);
  doc.setTextColor(lightTextColor);
  doc.text('Check-out', leftColX, currentY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  doc.text(format(parseISO(booking.check_out), 'EEE, dd MMM yyyy'), leftColX, currentY + 6);
  currentY += 15;
  
  doc.setFontSize(10);
  doc.setTextColor(lightTextColor);
  doc.text('Guests', leftColX, currentY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  doc.text(`${booking.guests.adults} Adult(s), ${booking.guests.children} Child(ren)`, leftColX, currentY + 6);

  // --- 4. Total Box ---
  // Ensure we are below both columns before drawing
  currentY = Math.max(currentY + 20, rightColYEnd + 20); 

  doc.setFillColor('#F8F9FA');
  doc.setDrawColor(borderColor);
  doc.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'FD');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor);
  doc.text('Total Paid', margin + 10, currentY + 13);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandColor);
  doc.text(formatCurrency(booking.price_breakdown.total), pageWidth - margin - 10, currentY + 13, { align: 'right' });

  // --- 5. Footer ---
  currentY += 35;
  doc.setDrawColor(borderColor);
  doc.line(margin, currentY, pageWidth - margin, currentY); // Final line
  currentY += 10;

  doc.setFontSize(10);
  doc.setTextColor(lightTextColor);
  doc.text('If you have any questions, please contact our support team.', margin, currentY);
  doc.text(`© ${new Date().getFullYear()} ProBooker. All rights reserved.`, pageWidth - margin, currentY, { align: 'right' });

  // --- 6. Save ---
  doc.save(`ProBooker-Receipt-${booking.booking_reference}.pdf`);
};