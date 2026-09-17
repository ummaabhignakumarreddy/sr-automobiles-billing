import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Vehicle, VehicleCategory, FuelType, StockStatus } from '../../types/database.types';
import { useAppData } from '../../context/AppDataContext';
import { X, AlertCircle } from 'lucide-react';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (vehicle: Vehicle) => void;
  initialVehicle?: Vehicle | null;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialVehicle,
}) => {
  const { addVehicle, updateVehicle, hsnList } = useAppData();

  const [category, setCategory] = useState<VehicleCategory>(initialVehicle?.category || 'Motorcycle');
  const [brand, setBrand] = useState(initialVehicle?.brand || '');
  const [model, setModel] = useState(initialVehicle?.model || '');
  const [variant, setVariant] = useState(initialVehicle?.variant || '');
  const [colour, setColour] = useState(initialVehicle?.colour || '');
  const [fuelType, setFuelType] = useState<FuelType>(initialVehicle?.fuel_type || 'Petrol');
  const [vinChassis, setVinChassis] = useState(initialVehicle?.vin_chassis || '');
  const [engineNumber, setEngineNumber] = useState(initialVehicle?.engine_number || '');
  const [motorNumber, setMotorNumber] = useState(initialVehicle?.motor_number || '');
  const [batteryNumber, setBatteryNumber] = useState(initialVehicle?.battery_number || '');
  const [batteryCapacity, setBatteryCapacity] = useState(initialVehicle?.battery_capacity || '');
  const [mfgMonth, setMfgMonth] = useState<number>(initialVehicle?.mfg_month || new Date().getMonth() + 1);
  const [mfgYear, setMfgYear] = useState<number>(initialVehicle?.mfg_year || new Date().getFullYear());
  const [hsnCode, setHsnCode] = useState(initialVehicle?.hsn_code || '871120');
  const [defaultGstRate, setDefaultGstRate] = useState<number>(initialVehicle?.default_gst_rate ?? 28);
  const [defaultCessRate, setDefaultCessRate] = useState<number>(initialVehicle?.default_cess_rate ?? 0);
  const [purchasePrice, setPurchasePrice] = useState<string>(initialVehicle ? String(initialVehicle.purchase_price) : '');
  const [defaultSellingPrice, setDefaultSellingPrice] = useState<string>(initialVehicle ? String(initialVehicle.default_selling_price) : '');
  const [supplierName, setSupplierName] = useState(initialVehicle?.supplier_name || '');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState(initialVehicle?.supplier_invoice_no || '');
  const [purchaseDate, setPurchaseDate] = useState(initialVehicle?.purchase_date || new Date().toISOString().split('T')[0]);
  const [stockStatus, setStockStatus] = useState<StockStatus>(initialVehicle?.stock_status || 'IN_STOCK');
  const [notes, setNotes] = useState(initialVehicle?.notes || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle HSN Selection Change
  const handleHsnChange = (code: string) => {
    setHsnCode(code);
    const selected = hsnList.find(h => h.hsn_code === code);
    if (selected) {
      setDefaultGstRate(selected.default_gst_rate);
      setDefaultCessRate(selected.default_cess_rate);
    }
  };

  const handleFuelChange = (fuel: FuelType) => {
    setFuelType(fuel);
    if (fuel === 'Electric') {
      if (category === 'Motorcycle') setCategory('Electric Motorcycle');
      if (category === 'Scooter') setCategory('Electric Scooter');
      handleHsnChange('871160'); // EV HSN 5%
    } else {
      if (category === 'Electric Motorcycle') setCategory('Motorcycle');
      if (category === 'Electric Scooter') setCategory('Scooter');
      handleHsnChange('871120'); // Petrol HSN 28%
    }
  };

  const resetForm = () => {
    setCategory('Motorcycle');
    setBrand('');
    setModel('');
    setVariant('');
    setColour('');
    setFuelType('Petrol');
    setVinChassis('');
    setEngineNumber('');
    setMotorNumber('');
    setBatteryNumber('');
    setBatteryCapacity('');
    setPurchasePrice('');
    setDefaultSellingPrice('');
    setSupplierName('');
    setSupplierInvoiceNo('');
    setNotes('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent, addAnother: boolean = false) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!brand.trim()) return setError('Brand is required');
    if (!model.trim()) return setError('Model is required');
    if (!variant.trim()) return setError('Variant is required');
    if (!colour.trim()) return setError('Colour is required');
    if (!vinChassis.trim()) return setError('Chassis / VIN Number is required');
    if (!purchasePrice || isNaN(Number(purchasePrice)) || Number(purchasePrice) <= 0) {
      return setError('Valid Purchase Price is required');
    }
    if (!defaultSellingPrice || isNaN(Number(defaultSellingPrice)) || Number(defaultSellingPrice) <= 0) {
      return setError('Valid Default Selling Price is required');
    }

    if (fuelType === 'Electric' && !motorNumber.trim()) {
      return setError('Motor Number is required for Electric Vehicles');
    }

    if (fuelType === 'Petrol' && !engineNumber.trim()) {
      return setError('Engine Number is required for Petrol Vehicles');
    }

    setIsSubmitting(true);

    try {
      if (initialVehicle) {
        // Edit mode
        const res = await updateVehicle(initialVehicle.id, {
          category,
          brand: brand.trim(),
          model: model.trim(),
          variant: variant.trim(),
          colour: colour.trim(),
          fuel_type: fuelType,
          vin_chassis: vinChassis.trim().toUpperCase(),
          engine_number: engineNumber.trim().toUpperCase() || undefined,
          motor_number: motorNumber.trim().toUpperCase() || undefined,
          battery_number: batteryNumber.trim().toUpperCase() || undefined,
          battery_capacity: batteryCapacity.trim() || undefined,
          mfg_month: mfgMonth,
          mfg_year: mfgYear,
          hsn_code: hsnCode,
          default_gst_rate: defaultGstRate,
          default_cess_rate: defaultCessRate,
          purchase_price: Number(purchasePrice),
          default_selling_price: Number(defaultSellingPrice),
          supplier_name: supplierName.trim() || undefined,
          supplier_invoice_no: supplierInvoiceNo.trim() || undefined,
          purchase_date: purchaseDate,
          stock_status: stockStatus,
          notes: notes.trim() || undefined,
        });

        if (!res.success) {
          setError(res.error || 'Failed to update vehicle');
          setIsSubmitting(false);
          return;
        }

        onClose();
      } else {
        // Add mode
        const vehCount = Date.now().toString().slice(-4);
        const res = await addVehicle({
          vehicle_id: `VEH-${mfgYear}-${vehCount}`,
          category,
          brand: brand.trim(),
          model: model.trim(),
          variant: variant.trim(),
          colour: colour.trim(),
          fuel_type: fuelType,
          vin_chassis: vinChassis.trim().toUpperCase(),
          engine_number: engineNumber.trim().toUpperCase() || undefined,
          motor_number: motorNumber.trim().toUpperCase() || undefined,
          battery_number: batteryNumber.trim().toUpperCase() || undefined,
          battery_capacity: batteryCapacity.trim() || undefined,
          mfg_month: mfgMonth,
          mfg_year: mfgYear,
          hsn_code: hsnCode,
          default_gst_rate: defaultGstRate,
          default_cess_rate: defaultCessRate,
          purchase_price: Number(purchasePrice),
          default_selling_price: Number(defaultSellingPrice),
          supplier_name: supplierName.trim() || undefined,
          supplier_invoice_no: supplierInvoiceNo.trim() || undefined,
          purchase_date: purchaseDate,
          stock_status: stockStatus,
          notes: notes.trim() || undefined,
        });

        if (!res.success) {
          setError(res.error || 'Failed to add vehicle');
          setIsSubmitting(false);
          return;
        }

        if (onSuccess && res.vehicle) {
          onSuccess(res.vehicle);
        }

        if (addAnother) {
          resetForm();
          // Keep common values like brand and model for convenience
          setBrand(brand);
          setModel(model);
          setVariant(variant);
          setColour(colour);
          setPurchasePrice(purchasePrice);
          setDefaultSellingPrice(defaultSellingPrice);
          setSupplierName(supplierName);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-scale-in">
        {/* Modal Header (Pinned) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialVehicle ? 'Edit Vehicle Details' : 'Add Vehicle to Inventory'}
            </h3>
            <p className="text-xs text-slate-500">
              Each unit must have an individual record with a unique Chassis/VIN number
            </p>
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
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700 font-medium shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={e => handleSubmit(e, false)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Category & Fuel Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Type *</label>
              <select
                value={fuelType}
                onChange={e => handleFuelChange(e.target.value as FuelType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as VehicleCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="Motorcycle">Motorcycle</option>
                <option value="Scooter">Scooter</option>
                <option value="Electric Motorcycle">Electric Motorcycle</option>
                <option value="Electric Scooter">Electric Scooter</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Status *</label>
              <select
                value={stockStatus}
                onChange={e => setStockStatus(e.target.value as StockStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="IN_STOCK">IN STOCK</option>
                <option value="BOOKED">BOOKED</option>
                <option value="SOLD">SOLD</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>
          </div>

          {/* Brand, Model, Variant, Colour */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand / Make *</label>
              <input
                type="text"
                placeholder="e.g. Hero, TVS, Ather, Ola"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model *</label>
              <input
                type="text"
                placeholder="e.g. Splendor+, 450X"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Variant *</label>
              <input
                type="text"
                placeholder="e.g. Disc OBD-2, Pro Pack"
                value={variant}
                onChange={e => setVariant(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Colour *</label>
              <input
                type="text"
                placeholder="e.g. Black with Silver"
                value={colour}
                onChange={e => setColour(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          </div>

          {/* VIN / Chassis, Engine, Motor, Battery */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Identification Numbers (Must be Unique)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Chassis / VIN Number *
                </label>
                <input
                  type="text"
                  placeholder="17-digit VIN (e.g. MD625AY89P0123451)"
                  value={vinChassis}
                  onChange={e => setVinChassis(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                  required
                />
              </div>

              {fuelType === 'Petrol' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Engine Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HA10ER8912345"
                    value={engineNumber}
                    onChange={e => setEngineNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Motor Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AT110EM9109876"
                    value={motorNumber}
                    onChange={e => setMotorNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    required
                  />
                </div>
              )}

              {fuelType === 'Electric' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Battery Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ATB37P9109876"
                      value={batteryNumber}
                      onChange={e => setBatteryNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Battery Capacity (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3.7 kWh, 4.0 kWh"
                      value={batteryCapacity}
                      onChange={e => setBatteryCapacity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mfg Month</label>
                <select
                  value={mfgMonth}
                  onChange={e => setMfgMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m} ({new Date(2026, m - 1).toLocaleString('default', { month: 'short' })})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mfg Year *</label>
                <input
                  type="number"
                  value={mfgYear}
                  onChange={e => setMfgYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code *</label>
                <select
                  value={hsnCode}
                  onChange={e => handleHsnChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {hsnList.filter(h => h.category === 'Vehicle').map(h => (
                    <option key={h.id} value={h.hsn_code}>
                      {h.hsn_code} ({h.default_gst_rate}% GST{h.default_cess_rate > 0 ? ` + ${h.default_cess_rate}% Cess` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GST & Cess %</label>
                <div className="flex space-x-1">
                  <input
                    type="number"
                    value={defaultGstRate}
                    onChange={e => setDefaultGstRate(Number(e.target.value))}
                    className="w-1/2 px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    title="GST %"
                  />
                  <input
                    type="number"
                    value={defaultCessRate}
                    onChange={e => setDefaultCessRate(Number(e.target.value))}
                    className="w-1/2 px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    title="Cess %"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Supplier Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Price (₹ - Internal) *
              </label>
              <input
                type="number"
                placeholder="Dealer purchase cost"
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Selling Price (₹) *
              </label>
              <input
                type="number"
                placeholder="Showroom base price"
                value={defaultSellingPrice}
                onChange={e => setDefaultSellingPrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name</label>
              <input
                type="text"
                placeholder="e.g. Hero MotoCorp Ltd Depot"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Internal Remarks</label>
            <textarea
              rows={2}
              placeholder="e.g. Accessories fitted, showroom display unit..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          </div>

          {/* Pinned Modal Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors btn-interactive"
            >
              Cancel
            </button>

            <div className="flex items-center space-x-3">
              {!initialVehicle && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={e => handleSubmit(e, true)}
                  className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors disabled:opacity-50 btn-interactive"
                >
                  Save & Add Another
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 btn-interactive"
              >
                {isSubmitting ? 'Saving...' : initialVehicle ? 'Update Vehicle' : 'Save Vehicle'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
