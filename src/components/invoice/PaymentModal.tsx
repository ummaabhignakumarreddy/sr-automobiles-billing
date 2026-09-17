import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Invoice, PaymentMode } from '../../types/database.types';
import { useAppData } from '../../context/AppDataContext';
import { formatINR } from '../../lib/formatters';
import { X, AlertCircle, CreditCard, Banknote, Smartphone, Building } from 'lucide-react';

interface PaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const { recordPayment } = useAppData();

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>(invoice ? String(invoice.balance_amount) : '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [financeCompany, setFinanceCompany] = useState('');
  const [loanApplicationRef, setLoanApplicationRef] = useState('');
  const [customerContribution, setCustomerContribution] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return setError('Please enter a valid positive payment amount');
    }

    if (numAmount > invoice.balance_amount) {
      return setError(`Amount cannot exceed balance due of ${formatINR(invoice.balance_amount)}`);
    }

    setIsSubmitting(true);

    try {
      const res = await recordPayment(invoice.id, {
        payment_date: paymentDate,
        amount: numAmount,
        payment_mode: paymentMode,
        reference_number: referenceNumber.trim() || undefined,
        finance_company: paymentMode === 'FINANCE' ? financeCompany.trim() || undefined : undefined,
        loan_application_ref: paymentMode === 'FINANCE' ? loanApplicationRef.trim() || undefined : undefined,
        customer_contribution: paymentMode === 'FINANCE' && customerContribution ? Number(customerContribution) : undefined,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || 'Failed to record payment');
        setIsSubmitting(false);
        return;
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
            <p className="text-xs text-slate-500 font-mono">Invoice: {invoice.invoice_number}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700 font-medium shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
            {/* Summary Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Grand Total</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{formatINR(invoice.grand_total)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Already Paid</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">{formatINR(invoice.total_paid)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Balance Due</span>
              <span className="font-bold text-red-700 font-mono text-sm">{formatINR(invoice.balance_amount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Pay (₹) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode *</label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="CHEQUE">Cheque / Demand Draft</option>
              <option value="FINANCE">Vehicle Auto Loan / Finance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref / UTR / Cheque No."
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>

          {/* Finance specifics if mode is FINANCE */}
          {paymentMode === 'FINANCE' && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
              <h4 className="font-bold text-blue-900 text-[11px] uppercase tracking-wider">
                Vehicle Finance Particulars
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Finance Institution / Bank
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, L&T Finance, Bajaj Finserv"
                    value={financeCompany}
                    onChange={e => setFinanceCompany(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Loan / Sanction Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LN-2026-98124"
                    value={loanApplicationRef}
                    onChange={e => setLoanApplicationRef(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="Payment remarks..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          </div>

          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors btn-interactive"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 btn-interactive"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
