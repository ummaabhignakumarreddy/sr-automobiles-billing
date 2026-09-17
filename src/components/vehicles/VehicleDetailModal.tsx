import React from 'react';
import { createPortal } from 'react-dom';
import { Vehicle } from '../../types/database.types';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDateReadable } from '../../lib/formatters';
import { X, Bike, Zap, FileText, Calendar, Building2 } from 'lucide-react';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onEdit?: (vehicle: Vehicle) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  onClose,
  onEdit,
}) => {
  if (!vehicle) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-scale-in">
        {/* Pinned Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-lg">
              {vehicle.fuel_type === 'Electric' ? <Zap className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {vehicle.brand} {vehicle.model} - {vehicle.variant}
              </h3>
              <p className="text-xs text-slate-500 font-mono">ID: {vehicle.vehicle_id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <StatusBadge status={vehicle.stock_status} />
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Details Content (Scrollable) */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          {/* Main Identifiers Box */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                CHASSIS / VIN NUMBER
              </span>
              <span className="text-base font-black tracking-widest text-red-400">
                {vehicle.vin_chassis}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  {vehicle.fuel_type === 'Electric' ? 'MOTOR NUMBER' : 'ENGINE NUMBER'}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {vehicle.fuel_type === 'Electric' ? vehicle.motor_number || '-' : vehicle.engine_number || '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  {vehicle.fuel_type === 'Electric' ? 'BATTERY NUMBER' : 'MFG DATE'}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {vehicle.fuel_type === 'Electric'
                    ? `${vehicle.battery_number || '-'} ${vehicle.battery_capacity ? `(${vehicle.battery_capacity})` : ''}`
                    : `${vehicle.mfg_month ? `${vehicle.mfg_month}/` : ''}${vehicle.mfg_year}`}
                </span>
              </div>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Category</span>
              <span className="font-semibold text-slate-900">{vehicle.category}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Fuel Type</span>
              <span className="font-semibold text-slate-900">{vehicle.fuel_type}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Colour</span>
              <span className="font-semibold text-slate-900">{vehicle.colour}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">HSN Code</span>
              <span className="font-mono font-semibold text-slate-900">{vehicle.hsn_code}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">GST Rate</span>
              <span className="font-semibold text-slate-900">{vehicle.default_gst_rate}%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Cess Rate</span>
              <span className="font-semibold text-slate-900">{vehicle.default_cess_rate}%</span>
            </div>
          </div>

          {/* Commercial & Supplier Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[11px]">Showroom Selling Price</span>
              <span className="text-lg font-bold text-slate-950 font-mono">
                {formatINR(vehicle.default_selling_price)}
              </span>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
              <span className="text-slate-500 block text-[11px]">Dealer Purchase Cost (Private)</span>
              <span className="text-lg font-bold text-slate-700 font-mono">
                {formatINR(vehicle.purchase_price)}
              </span>
            </div>
          </div>

          {vehicle.supplier_name && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-slate-700">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-900">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Supplier Information</span>
              </div>
              <p>Supplier: {vehicle.supplier_name}</p>
              {vehicle.supplier_invoice_no && <p>Invoice: {vehicle.supplier_invoice_no}</p>}
              {vehicle.purchase_date && <p>Purchase Date: {formatDateReadable(vehicle.purchase_date)}</p>}
            </div>
          )}

          {vehicle.notes && (
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[11px] mb-1 font-semibold">Notes:</span>
              <p className="text-slate-700 whitespace-pre-line">{vehicle.notes}</p>
            </div>
          )}
        </div>

        {/* Pinned Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors btn-interactive"
          >
            Close
          </button>
          {onEdit && vehicle.stock_status !== 'SOLD' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(vehicle);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors btn-interactive"
            >
              Edit Vehicle
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
