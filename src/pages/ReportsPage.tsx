import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { formatINR, formatDateIndian } from '../lib/formatters';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  Filter,
  Receipt,
  AlertCircle,
} from 'lucide-react';

type ReportType =
  | 'gst-sales-register'
  | 'hsn-summary'
  | 'tax-summary'
  | 'daily-sales'
  | 'monthly-sales'
  | 'outstanding-payments'
  | 'vehicles-sold';

export const ReportsPage: React.FC = () => {
  const { invoices, vehicles } = useAppData();

  const [selectedReport, setSelectedReport] = useState<ReportType>('gst-sales-register');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filter invoices by date range if specified
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (inv.status === 'CANCELLED') return false; // Filter active finalized invoices
      let match = true;
      if (startDate) match = match && inv.invoice_date >= startDate;
      if (endDate) match = match && inv.invoice_date <= endDate;
      return match;
    });
  }, [invoices, startDate, endDate]);

  // 1. GST Sales Register (B2B & B2C)
  const gstRegisterData = useMemo(() => {
    return filteredInvoices.map(inv => ({
      invoiceNumber: inv.invoice_number,
      invoiceDate: inv.invoice_date,
      customerName: inv.customer_snapshot.name,
      gstin: inv.customer_snapshot.gstin || 'B2C (Unregistered)',
      placeOfSupply: `${inv.place_of_supply} (${inv.place_of_supply_state_code})`,
      vehicleDetails: `${inv.vehicle_snapshot.brand} ${inv.vehicle_snapshot.model} (VIN: ${inv.vehicle_snapshot.vin_chassis})`,
      taxableValue: inv.taxable_value,
      cgst: inv.cgst_amount,
      sgst: inv.sgst_amount,
      igst: inv.igst_amount,
      cess: inv.cess_amount,
      grandTotal: inv.grand_total,
    }));
  }, [filteredInvoices]);

  // 2. HSN Summary (Grouped by HSN/SAC)
  const hsnSummaryData = useMemo(() => {
    const map: Record<
      string,
      {
        hsn: string;
        description: string;
        totalQty: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
        cess: number;
        totalAmount: number;
      }
    > = {};

    filteredInvoices.forEach(inv => {
      if (inv.items) {
        inv.items.forEach(item => {
          if (!map[item.hsn_sac]) {
            map[item.hsn_sac] = {
              hsn: item.hsn_sac,
              description: item.description.split('-')[0].trim(),
              totalQty: 0,
              taxableValue: 0,
              cgst: 0,
              sgst: 0,
              igst: 0,
              cess: 0,
              totalAmount: 0,
            };
          }
          map[item.hsn_sac].totalQty += item.quantity;
          map[item.hsn_sac].taxableValue += item.taxable_value;
          map[item.hsn_sac].cgst += item.cgst_amount;
          map[item.hsn_sac].sgst += item.sgst_amount;
          map[item.hsn_sac].igst += item.igst_amount;
          map[item.hsn_sac].cess += item.cess_amount;
          map[item.hsn_sac].totalAmount += item.total_amount;
        });
      }
    });

    return Object.values(map);
  }, [filteredInvoices]);

  // 3. Tax Summary (Rate-wise slab totals: 5%, 28%, Exempt)
  const taxSummaryData = useMemo(() => {
    const slabs: Record<string, { rate: string; taxable: number; cgst: number; sgst: number; igst: number; cess: number }> = {
      '5%': { rate: '5% (EV Two-Wheelers)', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      '28%': { rate: '28% (Petrol Motorcycles & Accessories)', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      '18%': { rate: '18% (Handling / Services / Insurance)', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      '0%': { rate: '0% (Exempt / RTO Fees)', taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
    };

    filteredInvoices.forEach(inv => {
      if (inv.items) {
        inv.items.forEach(item => {
          const key = item.tax_treatment === 'EXEMPT' || item.tax_treatment === 'NON_GST' ? '0%' : `${item.gst_rate}%`;
          if (slabs[key]) {
            slabs[key].taxable += item.taxable_value;
            slabs[key].cgst += item.cgst_amount;
            slabs[key].sgst += item.sgst_amount;
            slabs[key].igst += item.igst_amount;
            slabs[key].cess += item.cess_amount;
          }
        });
      }
    });

    return Object.values(slabs);
  }, [filteredInvoices]);

  // 4. Outstanding Payments
  const outstandingData = useMemo(() => {
    return filteredInvoices
      .filter(inv => inv.balance_amount > 0)
      .map(inv => ({
        invoiceNumber: inv.invoice_number,
        date: inv.invoice_date,
        customerName: inv.customer_snapshot.name,
        mobile: inv.customer_snapshot.mobile,
        vehicle: `${inv.vehicle_snapshot.brand} ${inv.vehicle_snapshot.model}`,
        grandTotal: inv.grand_total,
        paid: inv.total_paid,
        balance: inv.balance_amount,
        status: inv.payment_status,
      }));
  }, [filteredInvoices]);

  // 5. Vehicles Sold Report
  const vehiclesSoldData = useMemo(() => {
    return filteredInvoices.map(inv => ({
      invoiceNumber: inv.invoice_number,
      saleDate: inv.invoice_date,
      brand: inv.vehicle_snapshot.brand,
      model: inv.vehicle_snapshot.model,
      variant: inv.vehicle_snapshot.variant,
      colour: inv.vehicle_snapshot.colour,
      vin: inv.vehicle_snapshot.vin_chassis,
      engineMotor: inv.vehicle_snapshot.fuel_type === 'Electric' ? inv.vehicle_snapshot.motor_number : inv.vehicle_snapshot.engine_number,
      buyerName: inv.customer_snapshot.name,
      buyerMobile: inv.customer_snapshot.mobile,
      sellingPrice: inv.grand_total,
    }));
  }, [filteredInvoices]);

  // Export to CSV Function
  const exportToCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = `Report_${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`;

    if (selectedReport === 'gst-sales-register') {
      headers = [
        'Invoice Number',
        'Invoice Date',
        'Customer Name',
        'GSTIN',
        'Place of Supply',
        'Vehicle & VIN',
        'Taxable Value',
        'CGST',
        'SGST',
        'IGST',
        'Cess',
        'Grand Total',
      ];
      rows = gstRegisterData.map(d => [
        d.invoiceNumber,
        d.invoiceDate,
        `"${d.customerName}"`,
        d.gstin,
        `"${d.placeOfSupply}"`,
        `"${d.vehicleDetails}"`,
        d.taxableValue.toFixed(2),
        d.cgst.toFixed(2),
        d.sgst.toFixed(2),
        d.igst.toFixed(2),
        d.cess.toFixed(2),
        d.grandTotal.toFixed(2),
      ]);
    } else if (selectedReport === 'hsn-summary') {
      headers = ['HSN/SAC', 'Description', 'Quantity', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Cess', 'Total Amount'];
      rows = hsnSummaryData.map(d => [
        d.hsn,
        `"${d.description}"`,
        d.totalQty,
        d.taxableValue.toFixed(2),
        d.cgst.toFixed(2),
        d.sgst.toFixed(2),
        d.igst.toFixed(2),
        d.cess.toFixed(2),
        d.totalAmount.toFixed(2),
      ]);
    } else if (selectedReport === 'outstanding-payments') {
      headers = ['Invoice Number', 'Date', 'Customer Name', 'Mobile', 'Vehicle', 'Grand Total', 'Paid', 'Balance Due', 'Status'];
      rows = outstandingData.map(d => [
        d.invoiceNumber,
        d.date,
        `"${d.customerName}"`,
        d.mobile,
        `"${d.vehicle}"`,
        d.grandTotal.toFixed(2),
        d.paid.toFixed(2),
        d.balance.toFixed(2),
        d.status,
      ]);
    } else if (selectedReport === 'vehicles-sold') {
      headers = ['Invoice No', 'Sale Date', 'Brand', 'Model', 'Variant', 'Colour', 'Chassis/VIN', 'Engine/Motor No', 'Buyer Name', 'Mobile', 'Grand Total'];
      rows = vehiclesSoldData.map(d => [
        d.invoiceNumber,
        d.saleDate,
        d.brand,
        d.model,
        d.variant,
        d.colour,
        d.vin,
        d.engineMotor || '',
        `"${d.buyerName}"`,
        d.buyerMobile,
        d.sellingPrice.toFixed(2),
      ]);
    } else {
      headers = ['Tax Slab', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Cess'];
      rows = taxSummaryData.map(d => [
        `"${d.rate}"`,
        d.taxable.toFixed(2),
        d.cgst.toFixed(2),
        d.sgst.toFixed(2),
        d.igst.toFixed(2),
        d.cess.toFixed(2),
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900">GST Compliance & Sales Reports</h2>
          <p className="text-xs text-slate-500">
            Export structured registers formatted for review by your Chartered Accountant (CA) or tax auditor
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-xl border border-slate-200 shadow-xs no-print text-xs">
        {[
          { id: 'gst-sales-register' as ReportType, label: 'GST Sales Register' },
          { id: 'hsn-summary' as ReportType, label: 'HSN / SAC Summary' },
          { id: 'tax-summary' as ReportType, label: 'Rate-wise Tax Summary' },
          { id: 'vehicles-sold' as ReportType, label: 'Vehicle Sold Register' },
          { id: 'outstanding-payments' as ReportType, label: 'Outstanding Dues' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id)}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-colors ${
              selectedReport === tab.id
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">Filter Invoicing Period:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            title="Start Date"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            title="End Date"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-red-600 hover:underline text-xs ml-2 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-slate-500">
          Showing data from <strong>{filteredInvoices.length}</strong> finalized sales
        </div>
      </div>

      {/* CA Compliance Disclaimer */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2 text-[11px] text-slate-600">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          <strong>Notice:</strong> This software formats transaction registers for accounting review. It does not automatically file GSTR-1 or GSTR-3B tax returns.
        </span>
      </div>

      {/* Report Table Display */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {selectedReport === 'gst-sales-register' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">Invoice No & Date</th>
                  <th className="p-3">Customer & GSTIN</th>
                  <th className="p-3">Place of Supply</th>
                  <th className="p-3 text-right">Taxable Value</th>
                  <th className="p-3 text-right">CGST</th>
                  <th className="p-3 text-right">SGST</th>
                  <th className="p-3 text-right">IGST</th>
                  <th className="p-3 text-right">Cess</th>
                  <th className="p-3 text-right">Invoice Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gstRegisterData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{row.invoiceNumber}</p>
                      <p className="text-slate-500 font-sans">{formatDateIndian(row.invoiceDate)}</p>
                    </td>
                    <td className="p-3 font-sans">
                      <p className="font-bold text-slate-900">{row.customerName}</p>
                      <p className="text-slate-500 font-mono text-[10px]">{row.gstin}</p>
                    </td>
                    <td className="p-3 font-sans text-slate-700">{row.placeOfSupply}</td>
                    <td className="p-3 text-right font-semibold text-slate-900">{formatINR(row.taxableValue, false)}</td>
                    <td className="p-3 text-right text-slate-700">{formatINR(row.cgst, false)}</td>
                    <td className="p-3 text-right text-slate-700">{formatINR(row.sgst, false)}</td>
                    <td className="p-3 text-right text-slate-700">{formatINR(row.igst, false)}</td>
                    <td className="p-3 text-right text-slate-700">{formatINR(row.cess, false)}</td>
                    <td className="p-3 text-right font-bold text-slate-950">{formatINR(row.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'hsn-summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">HSN/SAC</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Total Qty</th>
                  <th className="p-3 text-right">Taxable Value</th>
                  <th className="p-3 text-right">CGST</th>
                  <th className="p-3 text-right">SGST</th>
                  <th className="p-3 text-right">IGST</th>
                  <th className="p-3 text-right">Cess</th>
                  <th className="p-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {hsnSummaryData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{row.hsn}</td>
                    <td className="p-3 font-sans text-slate-700">{row.description}</td>
                    <td className="p-3 text-center font-bold">{row.totalQty}</td>
                    <td className="p-3 text-right font-semibold text-slate-900">{formatINR(row.taxableValue)}</td>
                    <td className="p-3 text-right text-slate-700">{formatINR(row.cgst)}</td>
                    <td className="p-3 text-right text-slate-700">{formatINR(row.sgst)}</td>
                    <td className="p-3 text-right text-slate-700">{formatINR(row.igst)}</td>
                    <td className="p-3 text-right text-slate-700">{formatINR(row.cess)}</td>
                    <td className="p-3 text-right font-bold text-slate-950">{formatINR(row.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'tax-summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">Tax Slab & Category</th>
                  <th className="p-3 text-right">Taxable Value</th>
                  <th className="p-3 text-right">CGST Amount</th>
                  <th className="p-3 text-right">SGST Amount</th>
                  <th className="p-3 text-right">IGST Amount</th>
                  <th className="p-3 text-right">Compensation Cess</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {taxSummaryData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-bold text-slate-900">{row.rate}</td>
                    <td className="p-3 text-right font-semibold">{formatINR(row.taxable)}</td>
                    <td className="p-3 text-right">{formatINR(row.cgst)}</td>
                    <td className="p-3 text-right">{formatINR(row.sgst)}</td>
                    <td className="p-3 text-right">{formatINR(row.igst)}</td>
                    <td className="p-3 text-right">{formatINR(row.cess)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'vehicles-sold' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">Invoice & Date</th>
                  <th className="p-3">Brand & Model</th>
                  <th className="p-3">Chassis / VIN Number</th>
                  <th className="p-3">Engine / Motor No.</th>
                  <th className="p-3">Buyer Name & Mobile</th>
                  <th className="p-3 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {vehiclesSoldData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-mono font-bold text-slate-900">{row.invoiceNumber}</p>
                      <p className="text-slate-500 text-[10px]">{formatDateIndian(row.saleDate)}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{row.brand} {row.model}</p>
                      <p className="text-slate-500 text-[10px]">{row.variant} ({row.colour})</p>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-950">{row.vin}</td>
                    <td className="p-3 font-mono text-slate-700">{row.engineMotor || '-'}</td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{row.buyerName}</p>
                      <p className="text-slate-500 font-mono text-[10px]">{row.buyerMobile}</p>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-950">{formatINR(row.sellingPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'outstanding-payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">Invoice No & Date</th>
                  <th className="p-3">Customer Profile</th>
                  <th className="p-3">Vehicle Details</th>
                  <th className="p-3 text-right">Invoice Total</th>
                  <th className="p-3 text-right">Total Paid</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {outstandingData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-mono font-bold text-slate-900">{row.invoiceNumber}</p>
                      <p className="text-slate-500 text-[10px]">{formatDateIndian(row.date)}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{row.customerName}</p>
                      <p className="text-slate-500 font-mono text-[10px]">{row.mobile}</p>
                    </td>
                    <td className="p-3 text-slate-800 font-medium">{row.vehicle}</td>
                    <td className="p-3 text-right font-mono font-semibold">{formatINR(row.grandTotal)}</td>
                    <td className="p-3 text-right font-mono text-emerald-700">{formatINR(row.paid)}</td>
                    <td className="p-3 text-right font-mono font-bold text-red-700">{formatINR(row.balance)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
