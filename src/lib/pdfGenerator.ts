import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, InvoiceCopyType } from '../types/database.types';
import { formatINR, formatDateIndian } from './formatters';
import { numberToWordsIndian } from './currencyWords';
import { LOGO_BASE64 } from '../assets/logoBase64';

export function generateInvoicePdf(invoice: Invoice, copyType: InvoiceCopyType = 'ORIGINAL FOR RECIPIENT'): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 190mm
  let y = 12;

  const {
    invoice_number,
    invoice_date,
    place_of_supply,
    place_of_supply_state_code,
    reverse_charge,
    customer_snapshot: customer,
    vehicle_snapshot: vehicle,
    business_snapshot: business,
    items = [],
    taxable_value,
    cgst_amount,
    sgst_amount,
    igst_amount,
    cess_amount,
    round_off,
    grand_total,
    total_paid,
    balance_amount,
    payment_status,
    payments = [],
  } = invoice;

  const isIntraState = business.state_code === place_of_supply_state_code;
  const grandTotalWords = numberToWordsIndian(grand_total);
  const isElectric = vehicle.fuel_type === 'Electric';
  const hasCess = (cess_amount || 0) > 0;

  const formattedPhone = business.phone
    ? business.phone.startsWith('+91')
      ? business.phone
      : `+91 ${business.phone}`
    : '+91 8367444144';

  const hasBankDetails = Boolean(
    business.bank_name?.trim() && business.account_number?.trim()
  );

  // Outer Document Border (sharp 1px dark border)
  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.35);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  // 1. Copy Type Tag (Top and Centered)
  y = margin + 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  const copyTagWidth = 52;
  doc.rect(pageWidth / 2 - copyTagWidth / 2, y, copyTagWidth, 4.5);
  doc.text(copyType, pageWidth / 2, y + 3.2, { align: 'center' });

  // 2. Dealership Header with Logo (Top-Left) and Centered Information
  y += 9.5;
  const logoSize = 18;
  const logoX = margin + 3;
  const logoY = y - 5.5;

  try {
    const logoData = business.logo_url && business.logo_url.startsWith('data:')
      ? business.logo_url
      : LOGO_BASE64;
    // Draw crisp dealership logo at top-left
    doc.addImage(logoData, 'PNG', logoX, logoY, logoSize, logoSize);
    // Subtle crisp border around logo
    doc.setDrawColor(34, 34, 34);
    doc.setLineWidth(0.2);
    doc.rect(logoX, logoY, logoSize, logoSize);
  } catch {
    // Graceful fallback if image rendering fails
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42); // dark slate
  doc.text(business.business_name || 'SR AUTOMOBILES', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Address line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const addressLine = `${business.address}, ${business.city}, ${business.state} - ${business.pincode}`;
  doc.text(addressLine, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Phone & Email (if present)
  let contactLine = `Phone: ${formattedPhone}`;
  if (business.email && business.email.trim()) {
    contactLine += `  |  Email: ${business.email.trim()}`;
  }
  doc.text(contactLine, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // GSTIN row: ONLY if configured
  if (business.gstin && business.gstin.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`GSTIN: ${business.gstin.trim()}`, pageWidth / 2, y, { align: 'center' });
    y += 4.5;
  }

  // Divider Line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.25);
  doc.line(margin + 2, y, margin + contentWidth - 2, y);
  y += 4;

  // TAX INVOICE Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('TAX INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 3.5;

  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;

  // 3. Invoice Metadata (2 columns)
  doc.setFontSize(7.5);
  const leftColX = margin + 3;
  const rightColX = margin + contentWidth / 2 + 3;

  // Left col: Invoice details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Invoice Number:', leftColX, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice_number, leftColX + 25, y);

  // Right col: Place of Supply
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Place of Supply:', rightColX, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${place_of_supply} (State Code: ${place_of_supply_state_code})`, rightColX + 28, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Invoice Date:', leftColX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDateIndian(invoice_date), leftColX + 25, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Tax Applicability:', rightColX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)', rightColX + 28, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Reverse Charge:', leftColX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(reverse_charge ? 'YES' : 'NO', leftColX + 25, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Payment Status:', rightColX, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(payment_status === 'PAID' ? 16 : 185, payment_status === 'PAID' ? 130 : 28, payment_status === 'PAID' ? 54 : 28);
  doc.text(payment_status, rightColX + 28, y);
  y += 4;

  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 3.5;

  // 4. Customer Section (BILL TO & SHIP TO)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('BILL TO / RECIPIENT', leftColX, y);
  doc.text('SHIP / DELIVER TO', rightColX, y);
  y += 3.5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(customer.name, leftColX, y);
  doc.text(customer.name, rightColX, y);
  y += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const billLines = doc.splitTextToSize(customer.billing_address || '', 85);
  doc.text(billLines, leftColX, y);

  const isSameAddress = !customer.delivery_address || customer.delivery_address.trim() === customer.billing_address.trim();
  if (isSameAddress) {
    doc.setFont('helvetica', 'italic');
    doc.text('Same as Billing Address', rightColX, y);
    doc.setFont('helvetica', 'normal');
  } else {
    const shipLines = doc.splitTextToSize(customer.delivery_address || '', 85);
    doc.text(shipLines, rightColX, y);
  }
  y += Math.max(billLines.length, 1) * 3.2 + 1;

  doc.text(`${customer.city}, ${customer.district ? customer.district + ', ' : ''}${customer.state} - ${customer.pincode}`, leftColX, y);
  doc.text(`Contact: ${customer.mobile}`, rightColX, y);
  y += 3.5;

  doc.text(`Mobile: ${customer.mobile}  |  State Code: ${customer.state_code}`, leftColX, y);
  y += 3.5;

  if (customer.gst_registered && customer.gstin) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`GSTIN: ${customer.gstin}`, leftColX, y);
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Consumer / Unregistered Person (B2C)', leftColX, y);
  }
  y += 4;

  // 5. VEHICLE DETAILS SECTION
  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.35);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin + 0.5, y, contentWidth - 1, 18, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('VEHICLE DETAILS', margin + 3, y + 4.2);
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`${vehicle.category.toUpperCase()}  |  ${vehicle.fuel_type.toUpperCase()}`, margin + contentWidth - 4, y + 4.2, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(margin + 2, y + 6, margin + contentWidth - 2, y + 6);

  // Vehicle Info Grid
  const vCol1 = margin + 3;
  const vCol2 = margin + 52;
  const vCol3 = margin + 105;
  const vCol4 = margin + 152;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Make & Model:', vCol1, y + 9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${vehicle.brand} ${vehicle.model}`, vCol1 + 20, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Colour & Fuel:', vCol3, y + 9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${vehicle.colour} (${vehicle.fuel_type})`, vCol3 + 18, y + 9.5);

  // Row 2: Chassis & Engine/Motor
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CHASSIS / VIN:', vCol1, y + 14.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.text(vehicle.vin_chassis, vCol1 + 22, y + 14.5);

  doc.setFontSize(7);
  if (isElectric) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Motor No:', vCol3, y + 14.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(vehicle.motor_number || '-', vCol3 + 15, y + 14.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Battery: ${vehicle.battery_number || '-'}`, vCol4, y + 14.5);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Engine No:', vCol3, y + 14.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(vehicle.engine_number || '-', vCol3 + 16, y + 14.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Mfg Year: ${vehicle.mfg_year}`, vCol4, y + 14.5);
  }

  y += 21;

  // 6. TAX INVOICE ITEMS TABLE (AutoTable)
  const tableHead = isIntraState
    ? (hasCess
        ? [['#', 'Description of Goods / Services', 'HSN/SAC', 'Qty', 'Rate (₹)', 'Taxable (₹)', 'GST%', 'CGST (₹)', 'SGST (₹)', 'Cess (₹)', 'Total (₹)']]
        : [['#', 'Description of Goods / Services', 'HSN/SAC', 'Qty', 'Rate (₹)', 'Taxable (₹)', 'GST%', 'CGST (₹)', 'SGST (₹)', 'Total (₹)']])
    : (hasCess
        ? [['#', 'Description of Goods / Services', 'HSN/SAC', 'Qty', 'Rate (₹)', 'Taxable (₹)', 'GST%', 'IGST (₹)', 'Cess (₹)', 'Total (₹)']]
        : [['#', 'Description of Goods / Services', 'HSN/SAC', 'Qty', 'Rate (₹)', 'Taxable (₹)', 'GST%', 'IGST (₹)', 'Total (₹)']]);

  const tableBody = items.map((item, idx) => {
    const desc = item.item_type === 'VEHICLE'
      ? `${item.description}\nChassis: ${vehicle.vin_chassis}`
      : item.description;

    if (isIntraState) {
      if (hasCess) {
        return [
          String(idx + 1),
          desc,
          item.hsn_sac,
          String(item.quantity),
          formatINR(item.rate, false),
          formatINR(item.taxable_value, false),
          item.tax_treatment === 'TAXABLE' ? `${item.gst_rate}%` : item.tax_treatment,
          formatINR(item.cgst_amount, false),
          formatINR(item.sgst_amount, false),
          formatINR(item.cess_amount, false),
          formatINR(item.total_amount, false),
        ];
      }
      return [
        String(idx + 1),
        desc,
        item.hsn_sac,
        String(item.quantity),
        formatINR(item.rate, false),
        formatINR(item.taxable_value, false),
        item.tax_treatment === 'TAXABLE' ? `${item.gst_rate}%` : item.tax_treatment,
        formatINR(item.cgst_amount, false),
        formatINR(item.sgst_amount, false),
        formatINR(item.total_amount, false),
      ];
    } else {
      if (hasCess) {
        return [
          String(idx + 1),
          desc,
          item.hsn_sac,
          String(item.quantity),
          formatINR(item.rate, false),
          formatINR(item.taxable_value, false),
          item.tax_treatment === 'TAXABLE' ? `${item.gst_rate}%` : item.tax_treatment,
          formatINR(item.igst_amount, false),
          formatINR(item.cess_amount, false),
          formatINR(item.total_amount, false),
        ];
      }
      return [
        String(idx + 1),
        desc,
        item.hsn_sac,
        String(item.quantity),
        formatINR(item.rate, false),
        formatINR(item.taxable_value, false),
        item.tax_treatment === 'TAXABLE' ? `${item.gst_rate}%` : item.tax_treatment,
        formatINR(item.igst_amount, false),
        formatINR(item.total_amount, false),
      ];
    }
  });

  const runAutoTable = (autoTable as any).default || autoTable;
  runAutoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 1.6,
      textColor: [15, 23, 42],
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: isIntraState
      ? {
          0: { halign: 'center', cellWidth: 8 },
          1: { halign: 'left', cellWidth: 'auto' },
          2: { halign: 'center', cellWidth: 16 },
          3: { halign: 'center', cellWidth: 10 },
          4: { halign: 'right', cellWidth: 18 },
          5: { halign: 'right', cellWidth: 20 },
          6: { halign: 'center', cellWidth: 12 },
          7: { halign: 'right', cellWidth: 18 },
          8: { halign: 'right', cellWidth: 18 },
          ...(hasCess ? { 9: { halign: 'right', cellWidth: 16 }, 10: { halign: 'right', cellWidth: 22, fontStyle: 'bold' } } : { 9: { halign: 'right', cellWidth: 22, fontStyle: 'bold' } }),
        }
      : {
          0: { halign: 'center', cellWidth: 8 },
          1: { halign: 'left', cellWidth: 'auto' },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'center', cellWidth: 10 },
          4: { halign: 'right', cellWidth: 20 },
          5: { halign: 'right', cellWidth: 22 },
          6: { halign: 'center', cellWidth: 14 },
          7: { halign: 'right', cellWidth: 24 },
          ...(hasCess ? { 8: { halign: 'right', cellWidth: 18 }, 9: { halign: 'right', cellWidth: 24, fontStyle: 'bold' } } : { 8: { halign: 'right', cellWidth: 24, fontStyle: 'bold' } }),
        },
  });

  y = (doc as any).lastAutoTable.finalY + 3;

  // 7. SUMMARY & TOTALS SECTION
  const summaryLeftX = margin + 2;
  const summaryRightX = margin + 115;
  const summaryWidth = 73;

  // Left Box: Words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('AMOUNT CHARGEABLE IN WORDS:', summaryLeftX, y);
  y += 3.5;

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const wordsLines = doc.splitTextToSize(grandTotalWords, 105);
  doc.text(wordsLines, summaryLeftX, y);
  y += wordsLines.length * 3.5 + 2;

  // PAYMENT DETAILS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('PAYMENT DETAILS:', summaryLeftX, y);
  y += 3.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);

  const primaryMode = payments.length > 0 ? payments.map(p => p.payment_mode).join(' + ') : 'DIRECT';
  doc.text(`Payment Mode: ${primaryMode}   |   Total Paid: ${formatINR(total_paid)}   |   Balance Due: ${formatINR(balance_amount)}`, summaryLeftX, y);
  y += 3.5;

  // Bank details ONLY if configured
  if (hasBankDetails) {
    doc.text(`Bank: ${business.bank_name}  |  A/C: ${business.account_number}  |  IFSC: ${business.ifsc}`, summaryLeftX, y);
    y += 3.5;
  }

  // Right Box: Totals Table
  let rightY = (doc as any).lastAutoTable.finalY + 3;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);

  const drawSummaryRow = (label: string, value: string, isBold: boolean = false, isHighlight: boolean = false) => {
    if (isHighlight) {
      doc.setFillColor(15, 23, 42);
      doc.rect(summaryRightX, rightY - 3, summaryWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(label, summaryRightX + 2, rightY + 1);
      doc.text(value, summaryRightX + summaryWidth - 2, rightY + 1, { align: 'right' });
      rightY += 6.5;
    } else {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(isBold ? 15 : 71, isBold ? 23 : 85, isBold ? 42 : 105);
      doc.text(label, summaryRightX + 2, rightY);
      doc.text(value, summaryRightX + summaryWidth - 2, rightY, { align: 'right' });
      doc.line(summaryRightX, rightY + 1.2, summaryRightX + summaryWidth, rightY + 1.2);
      rightY += 4.5;
    }
  };

  drawSummaryRow('Taxable Value:', formatINR(taxable_value));
  if (isIntraState) {
    drawSummaryRow('Central Tax (CGST):', formatINR(cgst_amount));
    drawSummaryRow('State Tax (SGST):', formatINR(sgst_amount));
  } else {
    drawSummaryRow('Integrated Tax (IGST):', formatINR(igst_amount));
  }
  if (hasCess) {
    drawSummaryRow('Compensation Cess:', formatINR(cess_amount));
  }
  drawSummaryRow('Round Off:', formatINR(round_off));
  drawSummaryRow('GRAND TOTAL:', formatINR(grand_total), true, true);

  y = Math.max(y + 3, rightY + 2);

  // 8. Terms & Conditions Section (Above Signatures)
  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TERMS & CONDITIONS:', margin + 2, y);
  y += 2.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  const termsArr = (business.terms_and_conditions || '').split('\n').slice(0, 3);
  termsArr.forEach(t => {
    doc.text(t, margin + 2, y);
    y += 2.5;
  });
  doc.text('* This is a Computer Generated Tax Invoice.', margin + 2, y);
  y += 4;

  // Signatures Section
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;

  const rightX = margin + contentWidth - 3;
  const sigLineWidth = 45;

  // Header Row (Dealership Signatory)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`FOR ${business.business_name || 'SR AUTOMOBILES'}`, rightX, y, { align: 'right' });

  // Signature line level (giving space above for signatures)
  const sigLineY = y + 10;

  // Digital Signature Image (if present in business profile)
  if (business.signature_url) {
    try {
      doc.addImage(business.signature_url, 'PNG', rightX - sigLineWidth + 5, sigLineY - 9, 35, 8);
    } catch {
      // Graceful fallback if image format unsupported in sync jsPDF
    }
  }

  // Dealership Signature Line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.25);
  doc.line(rightX - sigLineWidth, sigLineY, rightX, sigLineY);

  // Signatory details below the right signature line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('Authorized Signatory', rightX - (sigLineWidth / 2), sigLineY + 3.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text(business.authorized_signatory || 'Venkata Ramana Reddy Umma', rightX - (sigLineWidth / 2), sigLineY + 6.2, { align: 'center' });

  // Save PDF directly to user download folder
  const safeFilename = `Tax_Invoice_${invoice_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(safeFilename);
}
