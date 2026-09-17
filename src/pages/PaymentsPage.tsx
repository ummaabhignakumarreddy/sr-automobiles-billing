import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { PaymentMode } from '../types/database.types';
import { formatINR, formatDateIndian } from '../lib/formatters';
import { CreditCard, Search, Banknote, Smartphone, Building, Filter, FileSpreadsheet } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { invoices } = useAppData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');

  // Flatten payments across all invoices with invoice and customer context
  const allPayments = useMemo(() => {
    const list: Array<{
      id: string;
      invoice_id: string;
      invoice_number: string;
      customer_name: string;
      customer_mobile: string;
      vehicle_summary: string;
      payment_date: string;
      amount: number;
      payment_mode: PaymentMode;
      reference_number?: string;
      finance_company?: string;
      loan_application_ref?: string;
      notes?: string;
    }> = [];

    invoices.forEach(inv => {
      if (inv.payments && inv.payments.length > 0) {
        inv.payments.forEach(p => {
          list.push({
            id: p.id,
            invoice_id: inv.id,
            invoice_number: inv.invoice_number,
            customer_name: inv.customer_snapshot.name,
            customer_mobile: inv.customer_snapshot.mobile,
            vehicle_summary: `${inv.vehicle_snapshot.brand} ${inv.vehicle_snapshot.model}`,
            payment_date: p.payment_date,
            amount: p.amount,
            payment_mode: p.payment_mode,
            reference_number: p.reference_number,
            finance_company: p.finance_company,
            loan_application_ref: p.loan_application_ref,
            notes: p.notes,
          });
        });
      }
    });

    return list;
  }, [invoices]);

  const filteredPayments = useMemo(() => {
    return allPayments.filter(p => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        p.invoice_number.toLowerCase().includes(term) ||
        p.customer_name.toLowerCase().includes(term) ||
        p.customer_mobile.includes(term) ||
        (p.reference_number && p.reference_number.toLowerCase().includes(term)) ||
        (p.finance_company && p.finance_company.toLowerCase().includes(term));

      const matchMode = selectedMode === 'ALL' || p.payment_mode === selectedMode;
      return matchSearch && matchMode;
    });
  }, [allPayments, searchTerm, selectedMode]);

  const totalCollected = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [filteredPayments]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payment Transactions Ledger</h2>
          <p className="text-xs text-slate-500">
            Cash receipts, UPI payments, bank transfers, card debits, and vehicle financing loans
          </p>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3">
          <div className="p-2 bg-emerald-600 text-white rounded-lg">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
              Total Filtered Receipts
            </span>
            <span className="font-mono font-black text-emerald-950 text-base">
              {formatINR(totalCollected)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Invoice No, Customer, Mobile, UTR/Ref No, Finance Company..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedMode}
              onChange={e => setSelectedMode(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="ALL">All Payment Modes</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CARD">Card</option>
              <option value="CHEQUE">Cheque</option>
              <option value="FINANCE">Vehicle Finance</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
          Showing {filteredPayments.length} payment records
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-fade-in">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No payment records found</p>
            <p className="mt-1 text-slate-400">Payments recorded during invoice generation or settlement appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Invoice Number</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Payment Mode</th>
                  <th className="px-6 py-3">Reference / Finance Details</th>
                  <th className="px-6 py-3 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 text-slate-600 font-medium">
                      {formatDateIndian(p.payment_date)}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {p.invoice_number}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-900">{p.customer_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{p.customer_mobile}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 font-medium">
                      {p.vehicle_summary}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200 text-[11px]">
                        {p.payment_mode}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {p.reference_number && (
                        <p className="font-mono text-slate-700">Ref: {p.reference_number}</p>
                      )}
                      {p.finance_company && (
                        <p className="text-blue-700 font-medium">
                          {p.finance_company} {p.loan_application_ref ? `(${p.loan_application_ref})` : ''}
                        </p>
                      )}
                      {p.notes && <p className="text-[10px] text-slate-500 italic">{p.notes}</p>}
                      {!p.reference_number && !p.finance_company && !p.notes && (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatINR(p.amount)}
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
