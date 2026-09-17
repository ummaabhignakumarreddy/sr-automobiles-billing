import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Invoice } from '../types/database.types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PaymentModal } from '../components/invoice/PaymentModal';
import { CancelInvoiceModal } from '../components/invoice/CancelInvoiceModal';
import { PrintableInvoice } from '../components/invoice/PrintableInvoice';
import { formatINR, formatDateIndian } from '../lib/formatters';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  CreditCard,
  Ban,
  Download,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface SalesHistoryPageProps {
  onNavigateNewInvoice: () => void;
}

export const SalesHistoryPage: React.FC<SalesHistoryPageProps> = ({ onNavigateNewInvoice }) => {
  const { invoices } = useAppData();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals state
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [cancelInvoice, setCancelInvoice] = useState<Invoice | null>(null);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        inv.invoice_number.toLowerCase().includes(term) ||
        inv.customer_snapshot.name.toLowerCase().includes(term) ||
        inv.customer_snapshot.mobile.includes(term) ||
        inv.vehicle_snapshot.vin_chassis.toLowerCase().includes(term) ||
        (inv.vehicle_snapshot.engine_number && inv.vehicle_snapshot.engine_number.toLowerCase().includes(term)) ||
        (inv.vehicle_snapshot.motor_number && inv.vehicle_snapshot.motor_number.toLowerCase().includes(term)) ||
        inv.vehicle_snapshot.brand.toLowerCase().includes(term) ||
        inv.vehicle_snapshot.model.toLowerCase().includes(term);

      const matchPayment = paymentFilter === 'ALL' || inv.payment_status === paymentFilter;
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;

      let matchDate = true;
      if (startDate) {
        matchDate = matchDate && inv.invoice_date >= startDate;
      }
      if (endDate) {
        matchDate = matchDate && inv.invoice_date <= endDate;
      }

      return matchSearch && matchPayment && matchStatus && matchDate;
    });
  }, [invoices, searchTerm, paymentFilter, statusFilter, startDate, endDate]);

  if (viewInvoice) {
    return (
      <div className="p-6">
        <PrintableInvoice
          invoice={viewInvoice}
          onBack={() => setViewInvoice(null)}
          showControls={true}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales & Invoices History</h2>
          <p className="text-xs text-slate-500">
            Consecutive GST Tax Invoices generated for physical vehicle deliveries
          </p>
        </div>

        <button
          onClick={onNavigateNewInvoice}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Receipt className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Comprehensive Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Universal Search Bar */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Invoice No, Customer, Mobile, VIN, Engine, Motor, Model..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Payment status filter */}
          <div className="md:col-span-2">
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="ALL">All Payment Status</option>
              <option value="PAID">PAID</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="UNPAID">UNPAID</option>
            </select>
          </div>

          {/* Invoice status filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="ALL">All Invoice Status</option>
              <option value="FINALIZED">FINALIZED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="md:col-span-3 flex items-center space-x-1.5">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              title="From Date"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              title="To Date"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Found {filteredInvoices.length} invoices</span>
          {(searchTerm || paymentFilter !== 'ALL' || statusFilter !== 'ALL' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPaymentFilter('ALL');
                setStatusFilter('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="text-red-600 hover:underline flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-fade-in">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No invoices recorded yet</p>
            <p className="mt-1 text-slate-400 mb-4">Generate consecutive GST Tax Invoices for physical vehicle deliveries.</p>
            <button
              onClick={onNavigateNewInvoice}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors btn-interactive"
            >
              <Receipt className="w-4 h-4" />
              <span>Create First Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Invoice Details</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Vehicle & Chassis/VIN</th>
                  <th className="px-5 py-3 text-right">Taxable</th>
                  <th className="px-5 py-3 text-right">Grand Total</th>
                  <th className="px-5 py-3 text-right">Paid / Balance</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => {
                  const totalTax = inv.cgst_amount + inv.sgst_amount + inv.igst_amount + inv.cess_amount;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Invoice No & Date */}
                      <td className="px-5 py-3.5">
                        <p className="font-mono font-bold text-slate-950 text-xs">
                          {inv.invoice_number}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatDateIndian(inv.invoice_date)}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{inv.customer_snapshot.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{inv.customer_snapshot.mobile}</p>
                        {inv.customer_snapshot.gst_registered && (
                          <span className="text-[10px] text-emerald-700 font-semibold">B2B Registered</span>
                        )}
                      </td>

                      {/* Vehicle */}
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">
                          {inv.vehicle_snapshot.brand} {inv.vehicle_snapshot.model}
                        </p>
                        <p className="text-[10px] font-mono font-bold text-slate-700">
                          VIN: {inv.vehicle_snapshot.vin_chassis}
                        </p>
                      </td>

                      {/* Taxable */}
                      <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                        {formatINR(inv.taxable_value, false)}
                      </td>

                      {/* Grand Total */}
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-950">
                        {formatINR(inv.grand_total)}
                      </td>

                      {/* Paid / Balance */}
                      <td className="px-5 py-3.5 text-right font-mono">
                        <p className="font-semibold text-emerald-700">{formatINR(inv.total_paid)}</p>
                        {inv.balance_amount > 0 && (
                          <p className="text-[11px] text-red-600 font-medium">
                            Due: {formatINR(inv.balance_amount)}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center space-y-1">
                        <div>
                          <StatusBadge status={inv.status} size="sm" />
                        </div>
                        <div>
                          <StatusBadge status={inv.payment_status} size="sm" />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            title="View / Print Tax Invoice"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {inv.status !== 'CANCELLED' && inv.balance_amount > 0 && (
                            <button
                              onClick={() => setPaymentInvoice(inv)}
                              title="Record Payment"
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {inv.status !== 'CANCELLED' && (
                            <button
                              onClick={() => setCancelInvoice(inv)}
                              title="Cancel Invoice"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Recording Modal */}
      <PaymentModal
        invoice={paymentInvoice}
        isOpen={Boolean(paymentInvoice)}
        onClose={() => setPaymentInvoice(null)}
      />

      {/* Invoice Cancellation Modal */}
      <CancelInvoiceModal
        invoice={cancelInvoice}
        isOpen={Boolean(cancelInvoice)}
        onClose={() => setCancelInvoice(null)}
      />
    </div>
  );
};
