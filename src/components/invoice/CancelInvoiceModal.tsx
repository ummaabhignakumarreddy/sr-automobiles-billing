import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Invoice, StockStatus } from '../../types/database.types';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { X, AlertTriangle } from 'lucide-react';

interface CancelInvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { cancelInvoice } = useAppData();
  const { user } = useAuth();

  const [reason, setReason] = useState('');
  const [restockStatus, setRestockStatus] = useState<StockStatus | 'NONE'>('IN_STOCK');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      return setError('A valid cancellation reason is required by GST audit standards.');
    }

    setIsSubmitting(true);

    try {
      const res = await cancelInvoice(
        invoice.id,
        reason.trim(),
        restockStatus,
        user?.id || 'usr-default',
        user?.email || 'staff@srautomobiles.in'
      );

      if (!res.success) {
        setError(res.error || 'Failed to cancel invoice');
        setIsSubmitting(false);
        return;
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invoice cancellation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-scale-in">
        {/* Pinned Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-950">Cancel Tax Invoice</h3>
              <p className="text-xs text-red-700 font-mono">Invoice: {invoice.invoice_number}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <p className="font-bold">Important GST Compliance Notice:</p>
            <p className="text-[11px] leading-relaxed">
              Once cancelled, this invoice will remain in the database marked as <strong>CANCELLED</strong>. The invoice number ({invoice.invoice_number}) will never be deleted or reused.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason *
            </label>
            <textarea
              rows={3}
              placeholder="Provide a specific audit reason (e.g. Customer cancelled purchase order, Data entry error in recipient GSTIN, Finance rejected...)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* Vehicle Inventory Restock Workflow */}
          {invoice.vehicle_snapshot && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Vehicle Stock Restoration Workflow
              </label>
              <p className="text-[11px] text-slate-600">
                Chassis/VIN: <strong className="font-mono">{invoice.vehicle_snapshot.vin_chassis}</strong> ({invoice.vehicle_snapshot.brand} {invoice.vehicle_snapshot.model})
              </p>
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="restock"
                    checked={restockStatus === 'IN_STOCK'}
                    onChange={() => setRestockStatus('IN_STOCK')}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>Return vehicle to <strong>IN STOCK</strong> (Available for new billing)</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="restock"
                    checked={restockStatus === 'BOOKED'}
                    onChange={() => setRestockStatus('BOOKED')}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>Mark vehicle as <strong>BOOKED</strong> (Reserved for another buyer)</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="restock"
                    checked={restockStatus === 'NONE'}
                    onChange={() => setRestockStatus('NONE')}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>Keep vehicle status unchanged (Unavailable)</span>
                </label>
              </div>
            </div>
          )}

          </div>

          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors btn-interactive"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 btn-interactive"
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Invoice Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
