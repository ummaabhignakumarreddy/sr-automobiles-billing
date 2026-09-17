import React, { useState } from 'react';
import { Invoice, InvoiceCopyType } from '../../types/database.types';
import { formatINR, formatDateIndian } from '../../lib/formatters';
import { numberToWordsIndian } from '../../lib/currencyWords';
import { generateInvoicePdf } from '../../lib/pdfGenerator';
import { Printer, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface PrintableInvoiceProps {
  invoice: Invoice;
  onBack?: () => void;
  showControls?: boolean;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoice,
  onBack,
  showControls = true,
}) => {
  const [copyType, setCopyType] = useState<InvoiceCopyType>('ORIGINAL FOR RECIPIENT');
  const [isDownloaded, setIsDownloaded] = useState(false);

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

  // Format phone to "+91 XXXXXXXXXX"
  const formattedPhone = business.phone
    ? business.phone.startsWith('+91')
      ? business.phone
      : `+91 ${business.phone}`
    : '+91 8367444144';

  const hasBankDetails = Boolean(
    business.bank_name?.trim() && business.account_number?.trim()
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      generateInvoicePdf(invoice, copyType);
      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 3500);
    } catch (err) {
      console.error('Vector PDF generation error:', err);
      window.print();
    }
  };

  // Primary payment mode label from records or default
  const primaryPaymentMode = payments.length > 0
    ? payments.map(p => p.payment_mode).join(' + ')
    : 'DIRECT';

  return (
    <div className="w-full flex flex-col items-center py-4 px-2 select-text">
      {/* Control Action Bar (Hidden in Print) */}
      {showControls && (
        <div className="no-print w-full max-w-[210mm] flex flex-wrap items-center justify-between gap-3 p-3 mb-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {/* Copy Type Selector */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              {(['ORIGINAL FOR RECIPIENT', 'DUPLICATE FOR TRANSPORTER', 'TRIPLICATE FOR SUPPLIER'] as InvoiceCopyType[]).map(
                type => (
                  <button
                    key={type}
                    onClick={() => setCopyType(type)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      copyType === type
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type.replace(' FOR ', ' - ')}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="btn-interactive flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="btn-interactive flex items-center space-x-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-red-600/20"
            >
              {isDownloaded ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isDownloaded ? 'Downloaded!' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Outer wrapper to allow screen horizontal scrolling on small monitors without scrollbars on paper */}
      <div className="w-full overflow-x-auto flex justify-center no-scrollbar">
        {/* TRUE A4 Invoice Paper Container */}
        <div
          id="printable-invoice"
          className="invoice-paper bg-white text-slate-900 border border-[#222] shadow-xl font-sans text-xs leading-normal animate-fade-in-up"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '10mm 12mm',
            boxSizing: 'border-box',
            overflow: 'visible',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Top Header: Copy Type Badge (Top and Centered) + Dealership Branding */}
          <div className="border-b border-[#333] pb-2.5">
            {/* Copy Type Indicator: Top and Centered */}
            <div className="flex justify-center mb-1.5">
              <span className="inline-block border border-slate-700 px-3 py-0.5 text-[8pt] font-bold tracking-widest uppercase text-slate-800 bg-slate-50">
                {copyType}
              </span>
            </div>

            {/* Dealership Branding with Logo in Perfect Proportion */}
            <div className="flex items-center justify-between">
              {/* Left: Dealership Logo */}
              <div className="w-20 shrink-0 flex items-center justify-start">
                <img
                  src="/logo.png"
                  alt="SR Automobiles Logo"
                  className="w-18 h-18 max-h-[72px] max-w-[72px] object-contain rounded-lg border border-slate-900 bg-black shadow-sm"
                />
              </div>

              {/* Center: Dealership Info */}
              <div className="flex-1 text-center px-2">
                <h1 className="text-[20pt] font-black tracking-wider text-slate-950 uppercase font-mono leading-none">
                  {business.business_name}
                </h1>
                <p className="text-[9.5pt] text-slate-700 mt-1 font-medium">
                  {business.address}, {business.city}, {business.state} - {business.pincode}
                </p>
                <p className="text-[9pt] text-slate-800 mt-0.5">
                  Phone: <span className="font-semibold text-slate-950">{formattedPhone}</span>
                  {business.email && business.email.trim() && (
                    <> &bull; Email: <span className="font-semibold text-slate-950">{business.email.trim()}</span></>
                  )}
                </p>
                {business.gstin && business.gstin.trim() && (
                  <p className="text-[9.5pt] font-bold text-slate-950 mt-0.5">
                    GSTIN: <span className="font-mono tracking-wider">{business.gstin.trim()}</span>
                  </p>
                )}
              </div>

              {/* Right: Invisible balance spacer so center text is mathematically centered */}
              <div className="w-20 shrink-0 hidden sm:block" aria-hidden="true" />
            </div>

            {/* Clean TAX INVOICE Title */}
            <div className="mt-2 pt-1.5 border-t border-slate-300 text-center">
              <h2 className="text-[13pt] font-black tracking-widest text-slate-950 uppercase font-mono">
                TAX INVOICE
              </h2>
            </div>
          </div>

          {/* Invoice Metadata Row */}
          <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#333] text-[9pt]">
            <div className="space-y-1">
              <div className="flex">
                <span className="w-28 text-slate-600 font-semibold">Invoice No:</span>
                <span className="font-mono font-bold text-slate-950">{invoice_number}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-600 font-semibold">Invoice Date:</span>
                <span className="font-medium text-slate-900">{formatDateIndian(invoice_date)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-600 font-semibold">Reverse Charge:</span>
                <span className="font-medium text-slate-900">{reverse_charge ? 'YES' : 'NO'}</span>
              </div>
            </div>

            <div className="space-y-1 text-right sm:text-left">
              <div className="flex justify-between sm:justify-start">
                <span className="w-36 text-slate-600 font-semibold">Place of Supply:</span>
                <span className="font-bold text-slate-950">{place_of_supply} (State Code: {place_of_supply_state_code})</span>
              </div>
              <div className="flex justify-between sm:justify-start">
                <span className="w-36 text-slate-600 font-semibold">Tax Applicability:</span>
                <span className="font-semibold text-slate-900">
                  {isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                </span>
              </div>
              <div className="flex justify-between sm:justify-start">
                <span className="w-36 text-slate-600 font-semibold">Payment Status:</span>
                <span className={`font-bold uppercase ${
                  payment_status === 'PAID' ? 'text-emerald-700' : payment_status === 'PARTIALLY_PAID' ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Customer / Recipient Section (2-Column Grid) */}
          <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#333] text-[9pt]">
            {/* Bill To */}
            <div className="pr-3 border-r border-slate-300 space-y-0.5">
              <h3 className="font-bold uppercase text-[8.5pt] tracking-wider text-slate-600 mb-1">
                BILL TO / RECIPIENT
              </h3>
              <p className="font-bold text-slate-950 text-[9.5pt]">{customer.name}</p>
              <p className="text-slate-800 leading-snug">{customer.billing_address}</p>
              <p className="text-slate-800">
                {customer.city}, {customer.district ? `${customer.district}, ` : ''}{customer.state} - {customer.pincode}
              </p>
              <p className="text-slate-800">
                State Code: <span className="font-mono font-medium">{customer.state_code}</span> &bull; Mobile: <span className="font-semibold">{customer.mobile}</span>
              </p>
              {customer.gst_registered && customer.gstin ? (
                <p className="text-slate-950 font-bold pt-0.5">
                  GSTIN: <span className="font-mono">{customer.gstin}</span>
                </p>
              ) : (
                <p className="text-slate-500 italic text-[8pt]">Consumer / Unregistered Person (B2C)</p>
              )}
            </div>

            {/* Ship To */}
            <div className="pl-2 space-y-0.5">
              <h3 className="font-bold uppercase text-[8.5pt] tracking-wider text-slate-600 mb-1">
                SHIP / DELIVER TO
              </h3>
              <p className="font-bold text-slate-950 text-[9.5pt]">{customer.name}</p>
              {customer.delivery_address && customer.delivery_address.trim() !== customer.billing_address.trim() ? (
                <>
                  <p className="text-slate-800 leading-snug">{customer.delivery_address}</p>
                  <p className="text-slate-800">
                    {customer.city}, {customer.state} - {customer.pincode}
                  </p>
                </>
              ) : (
                <p className="text-slate-600 italic text-[8.5pt] pt-1">
                  Same as Billing Address
                </p>
              )}
              <p className="text-slate-800 pt-1">
                Contact: <span className="font-semibold">{customer.mobile}</span>
              </p>
            </div>
          </div>

          {/* VEHICLE DETAILS SECTION (Prominent, Dealership-Standard Box) */}
          <div className="my-2 p-2 border border-[#333] bg-slate-50/50 print-avoid-break">
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-300">
              <h3 className="text-[9.5pt] font-black tracking-wider uppercase text-slate-950 font-mono">
                VEHICLE DETAILS
              </h3>
              <span className="text-[8pt] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-800">
                {vehicle.category.toUpperCase()} &bull; {vehicle.fuel_type.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[8.5pt]">
              <div>
                <span className="text-slate-500 block text-[7.5pt] uppercase font-semibold">Make & Model</span>
                <span className="font-bold text-slate-950">{vehicle.brand} {vehicle.model}</span>
                <span className="block text-[8pt] text-slate-600">{vehicle.variant}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[7.5pt] uppercase font-semibold">Colour & Fuel</span>
                <span className="font-bold text-slate-950">{vehicle.colour}</span>
                <span className="block text-[8pt] text-slate-600">Fuel: {vehicle.fuel_type}</span>
              </div>

              <div>
                <span className="text-slate-700 block text-[7.5pt] uppercase font-bold">CHASSIS / VIN NUMBER</span>
                <span className="font-mono font-black text-[9pt] text-slate-950 tracking-wider">
                  {vehicle.vin_chassis}
                </span>
                <span className="block text-[8pt] text-slate-600">Mfg Year: {vehicle.mfg_year}</span>
              </div>

              <div>
                {isElectric ? (
                  <>
                    <span className="text-slate-700 block text-[7.5pt] uppercase font-bold">MOTOR & BATTERY NO</span>
                    <span className="font-mono font-bold text-slate-950 block text-[8.5pt]">
                      M: {vehicle.motor_number || '-'}
                    </span>
                    <span className="font-mono text-slate-700 block text-[8pt]">
                      B: {vehicle.battery_number || '-'} {vehicle.battery_capacity ? `(${vehicle.battery_capacity})` : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-700 block text-[7.5pt] uppercase font-bold">ENGINE NUMBER</span>
                    <span className="font-mono font-black text-[9pt] text-slate-950 tracking-wider block">
                      {vehicle.engine_number || '-'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ITEM TABLE (Engineered within A4 Printable Area) */}
          <div className="my-2 border border-[#333] overflow-visible">
            <table className="w-full text-left text-[8.5pt] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold">
                  <th className="p-1.5 border-r border-slate-700 text-center w-7">#</th>
                  <th className="p-1.5 border-r border-slate-700">Description of Goods / Services</th>
                  <th className="p-1.5 border-r border-slate-700 text-center w-16">HSN/SAC</th>
                  <th className="p-1.5 border-r border-slate-700 text-center w-8">Qty</th>
                  <th className="p-1.5 border-r border-slate-700 text-right w-18">Rate (₹)</th>
                  <th className="p-1.5 border-r border-slate-700 text-right w-20">Taxable (₹)</th>
                  <th className="p-1.5 border-r border-slate-700 text-center w-12">GST %</th>
                  {isIntraState ? (
                    <>
                      <th className="p-1.5 border-r border-slate-700 text-right w-18">CGST (₹)</th>
                      <th className="p-1.5 border-r border-slate-700 text-right w-18">SGST (₹)</th>
                    </>
                  ) : (
                    <th className="p-1.5 border-r border-slate-700 text-right w-24">IGST (₹)</th>
                  )}
                  {hasCess && (
                    <th className="p-1.5 border-r border-slate-700 text-right w-16">Cess (₹)</th>
                  )}
                  <th className="p-1.5 text-right w-22">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="p-1.5 border-r border-slate-300 text-center font-medium">{idx + 1}</td>
                    <td className="p-1.5 border-r border-slate-300">
                      <p className="font-bold text-slate-950">{item.description}</p>
                      {item.item_type === 'VEHICLE' && (
                        <p className="text-[7.5pt] text-slate-600 font-mono">
                          Chassis: {vehicle.vin_chassis}
                        </p>
                      )}
                    </td>
                    <td className="p-1.5 border-r border-slate-300 text-center font-mono text-[8pt]">{item.hsn_sac}</td>
                    <td className="p-1.5 border-r border-slate-300 text-center">{item.quantity}</td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono">{formatINR(item.rate, false)}</td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono font-semibold">{formatINR(item.taxable_value, false)}</td>
                    <td className="p-1.5 border-r border-slate-300 text-center font-mono">
                      {item.tax_treatment === 'TAXABLE' ? `${item.gst_rate}%` : item.tax_treatment}
                    </td>
                    {isIntraState ? (
                      <>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{formatINR(item.cgst_amount, false)}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{formatINR(item.sgst_amount, false)}</td>
                      </>
                    ) : (
                      <td className="p-1.5 border-r border-slate-300 text-right font-mono">{formatINR(item.igst_amount, false)}</td>
                    )}
                    {hasCess && (
                      <td className="p-1.5 border-r border-slate-300 text-right font-mono">{formatINR(item.cess_amount, false)}</td>
                    )}
                    <td className="p-1.5 text-right font-mono font-bold text-slate-950">{formatINR(item.total_amount, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS & SUMMARY SECTION (Balanced Vertical Grid) */}
          <div className="grid grid-cols-12 gap-3 py-2 border-t border-[#333] print-avoid-break">
            {/* Left Column: Words + Payment Details */}
            <div className="col-span-7 flex flex-col justify-between space-y-2 text-[8.5pt]">
              <div>
                <p className="font-bold uppercase text-[7.5pt] text-slate-600 tracking-wider mb-1">
                  AMOUNT CHARGEABLE IN WORDS:
                </p>
                <div className="p-2 border border-slate-300 bg-slate-50/50">
                  <p className="text-[9pt] font-bold text-slate-950 italic leading-snug">
                    {grandTotalWords}
                  </p>
                </div>
              </div>

              {/* PAYMENT DETAILS */}
              <div className="p-2 border border-slate-300 bg-slate-50/30 text-[8pt] space-y-1">
                <p className="font-bold uppercase text-[7.5pt] text-slate-700 tracking-wider border-b border-slate-200 pb-0.5">
                  PAYMENT DETAILS
                </p>
                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  <div>
                    <span className="text-slate-500 block text-[7pt] uppercase">Payment Mode</span>
                    <span className="font-semibold text-slate-950">{primaryPaymentMode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[7pt] uppercase">Total Paid</span>
                    <span className="font-bold text-emerald-700 font-mono">{formatINR(total_paid)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[7pt] uppercase">Balance Due</span>
                    <span className="font-bold text-red-700 font-mono">{formatINR(balance_amount)}</span>
                  </div>
                </div>

                {/* Show Bank Details ONLY IF configured by user */}
                {hasBankDetails && (
                  <div className="pt-1.5 mt-1 border-t border-slate-200 text-slate-700">
                    <p className="font-semibold text-slate-800">
                      Bank: <span className="font-bold text-slate-950">{business.bank_name}</span> &bull; A/C No: <span className="font-mono font-bold text-slate-950">{business.account_number}</span>
                    </p>
                    <p className="text-[7.5pt]">
                      IFSC: <span className="font-mono font-bold">{business.ifsc}</span>
                      {business.upi_id && <> &bull; UPI: <span className="font-mono font-bold">{business.upi_id}</span></>}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Calculation Breakdown */}
            <div className="col-span-5 border border-slate-300 p-2 text-[8.5pt] space-y-1">
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-600">Taxable Value:</span>
                <span className="font-mono font-semibold">{formatINR(taxable_value)}</span>
              </div>

              {isIntraState ? (
                <>
                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                    <span className="text-slate-600">Central Tax (CGST):</span>
                    <span className="font-mono font-semibold">{formatINR(cgst_amount)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                    <span className="text-slate-600">State Tax (SGST):</span>
                    <span className="font-mono font-semibold">{formatINR(sgst_amount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-600">Integrated Tax (IGST):</span>
                  <span className="font-mono font-semibold">{formatINR(igst_amount)}</span>
                </div>
              )}

              {hasCess && (
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-600">Compensation Cess:</span>
                  <span className="font-mono font-semibold">{formatINR(cess_amount)}</span>
                </div>
              )}

              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-600">Round Off:</span>
                <span className="font-mono font-semibold">{formatINR(round_off)}</span>
              </div>

              {/* GRAND TOTAL */}
              <div className="flex justify-between items-center py-1.5 px-2.5 bg-slate-900 text-white font-mono text-[10pt] font-black mt-1">
                <span>GRAND TOTAL:</span>
                <span>{formatINR(grand_total)}</span>
              </div>
            </div>
          </div>

          {/* TERMS & CONDITIONS SECTION */}
          <div className="mt-2.5 pt-2 border-t border-[#333] text-[8pt] print-avoid-break">
            <p className="font-bold uppercase text-[7pt] text-slate-700 tracking-wider mb-0.5">
              Terms & Conditions:
            </p>
            <div className="text-slate-600 whitespace-pre-line leading-tight text-[7pt]">
              {business.terms_and_conditions}
            </div>
            <p className="mt-0.5 text-[6.5pt] text-slate-500 italic">
              * This is a Computer Generated Tax Invoice.
            </p>
          </div>

          {/* SIGNATURES SECTION */}
          <div className="mt-2.5 pt-2 border-t border-slate-300 print-avoid-break">
            <div className="flex justify-end items-start px-2">
              {/* Right Side: Dealership Signatory */}
              <div className="w-52 text-right flex flex-col items-end">
                <p className="text-[8pt] font-bold uppercase text-slate-950 mb-0.5 text-center w-48">
                  FOR {business.business_name || 'SR AUTOMOBILES'}
                </p>
                {/* Blank space for signature / digital signature if uploaded */}
                <div className="h-10 w-48 flex items-center justify-center">
                  {business.signature_url ? (
                    <img
                      src={business.signature_url}
                      alt="Signature"
                      className="max-h-9 object-contain"
                    />
                  ) : null}
                </div>
                {/* Straight sharp signature line */}
                <div className="w-48 border-t border-slate-900" />
                {/* Signatory details below the line */}
                <p className="text-[7.5pt] font-bold text-slate-950 pt-1 text-center w-48">
                  Authorized Signatory
                </p>
                <p className="text-[7pt] text-slate-700 font-semibold text-center w-48 mt-0.5">
                  {business.authorized_signatory || 'Venkata Ramana Reddy Umma'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
