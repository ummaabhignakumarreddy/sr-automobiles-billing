import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Customer, CustomerType } from '../../types/database.types';
import { useAppData } from '../../context/AppDataContext';
import { INDIAN_STATES, getStateByCode } from '../../lib/indianStates';
import { validateGSTIN, validateMobile, validatePincode, validatePAN } from '../../lib/validators';
import { X, AlertCircle } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: Customer) => void;
  initialCustomer?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCustomer,
}) => {
  const { addCustomer, updateCustomer, settings } = useAppData();

  const [customerType, setCustomerType] = useState<CustomerType>(initialCustomer?.customer_type || 'Individual');
  const [name, setName] = useState(initialCustomer?.name || '');
  const [mobile, setMobile] = useState(initialCustomer?.mobile || '');
  const [altMobile, setAltMobile] = useState(initialCustomer?.alt_mobile || '');
  const [email, setEmail] = useState(initialCustomer?.email || '');
  const [gstRegistered, setGstRegistered] = useState(initialCustomer?.gst_registered || false);
  const [gstin, setGstin] = useState(initialCustomer?.gstin || '');
  const [billingAddress, setBillingAddress] = useState(initialCustomer?.billing_address || '');
  const [deliveryAddress, setDeliveryAddress] = useState(initialCustomer?.delivery_address || '');
  const [sameAsBilling, setSameAsBilling] = useState(
    !initialCustomer?.delivery_address || initialCustomer.delivery_address === initialCustomer.billing_address
  );
  const [city, setCity] = useState(initialCustomer?.city || settings.city || 'Mylavaram');
  const [district, setDistrict] = useState(initialCustomer?.district || settings.district || 'NTR');
  const [stateCode, setStateCode] = useState(initialCustomer?.state_code || settings.state_code || '37');
  const [pincode, setPincode] = useState(initialCustomer?.pincode || '');
  const [pan, setPan] = useState(initialCustomer?.pan || '');
  const [notes, setNotes] = useState(initialCustomer?.notes || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStateChange = (code: string) => {
    setStateCode(code);
  };

  const handleGstinChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    setGstin(clean);
    // If user enters first 2 digits of GSTIN, suggest or align state code
    if (clean.length >= 2) {
      const gstinPrefix = clean.substring(0, 2);
      const matched = getStateByCode(gstinPrefix);
      if (matched) {
        setStateCode(matched.code);
      }
    }
    // Auto-extract PAN from characters 3-12 of GSTIN
    if (clean.length >= 12) {
      const extractedPan = clean.substring(2, 12);
      setPan(extractedPan);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Customer Name is required');

    // Validate mobile
    const mobCheck = validateMobile(mobile);
    if (!mobCheck.isValid) return setError(mobCheck.error || 'Invalid mobile number');

    if (altMobile.trim()) {
      const altCheck = validateMobile(altMobile);
      if (!altCheck.isValid) return setError(`Alternate Mobile: ${altCheck.error}`);
    }

    // Validate GSTIN if registered
    if (gstRegistered) {
      const gstinCheck = validateGSTIN(gstin, stateCode);
      if (!gstinCheck.isValid) return setError(gstinCheck.error || 'Invalid GSTIN');
    }

    if (!billingAddress.trim()) return setError('Billing Address is required');
    if (!city.trim()) return setError('City is required');

    // Validate PIN Code
    const pinCheck = validatePincode(pincode);
    if (!pinCheck.isValid) return setError(pinCheck.error || 'Invalid PIN Code');

    // Validate PAN if entered
    if (pan.trim()) {
      const panCheck = validatePAN(pan);
      if (!panCheck.isValid) return setError(panCheck.error || 'Invalid PAN');
    }

    const currentState = getStateByCode(stateCode);
    const stateName = currentState ? currentState.name : settings.state;
    const finalDeliveryAddress = sameAsBilling ? billingAddress.trim() : deliveryAddress.trim();

    setIsSubmitting(true);

    try {
      if (initialCustomer) {
        // Edit mode
        const res = await updateCustomer(initialCustomer.id, {
          customer_type: customerType,
          name: name.trim(),
          mobile: mobile.trim(),
          alt_mobile: altMobile.trim() || undefined,
          email: email.trim() || undefined,
          gst_registered: gstRegistered,
          gstin: gstRegistered ? gstin.trim().toUpperCase() : undefined,
          billing_address: billingAddress.trim(),
          delivery_address: finalDeliveryAddress,
          city: city.trim(),
          district: district.trim() || undefined,
          state: stateName,
          state_code: stateCode,
          pincode: pincode.trim(),
          pan: pan.trim().toUpperCase() || undefined,
          notes: notes.trim() || undefined,
        });

        if (!res.success) {
          setError(res.error || 'Failed to update customer');
          setIsSubmitting(false);
          return;
        }

        onClose();
      } else {
        // Add mode
        const custSeq = Date.now().toString().slice(-4);
        const res = await addCustomer({
          customer_id: `CUST-${new Date().getFullYear()}-${custSeq}`,
          customer_type: customerType,
          name: name.trim(),
          mobile: mobile.trim(),
          alt_mobile: altMobile.trim() || undefined,
          email: email.trim() || undefined,
          gst_registered: gstRegistered,
          gstin: gstRegistered ? gstin.trim().toUpperCase() : undefined,
          billing_address: billingAddress.trim(),
          delivery_address: finalDeliveryAddress,
          city: city.trim(),
          district: district.trim() || undefined,
          state: stateName,
          state_code: stateCode,
          pincode: pincode.trim(),
          pan: pan.trim().toUpperCase() || undefined,
          notes: notes.trim() || undefined,
        });

        if (!res.success) {
          setError(res.error || 'Failed to add customer');
          setIsSubmitting(false);
          return;
        }

        if (onSuccess && res.customer) {
          onSuccess(res.customer);
        }
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-scale-in">
        {/* Modal Header (Pinned) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialCustomer ? 'Edit Customer Information' : 'Add New Customer'}
            </h3>
            <p className="text-xs text-slate-500">
              Customer details for GST compliant vehicle invoices
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
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Customer Type & Registration Toggle */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Type *</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setCustomerType('Individual')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    customerType === 'Individual'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Individual (B2C)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerType('Business');
                    setGstRegistered(true);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    customerType === 'Business'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Business (B2B)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Registered? *</label>
              <div className="flex items-center space-x-3 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-800">
                  <input
                    type="radio"
                    name="gstReg"
                    checked={!gstRegistered}
                    onChange={() => setGstRegistered(false)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>No (Unregistered)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-800">
                  <input
                    type="radio"
                    name="gstReg"
                    checked={gstRegistered}
                    onChange={() => setGstRegistered(true)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>Yes (GST Registered)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Name & Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {customerType === 'Business' ? 'Company / Firm Name *' : 'Full Name *'}
              </label>
              <input
                type="text"
                placeholder={customerType === 'Business' ? 'e.g. Balaji Enterprises' : 'e.g. Rajesh Kumar'}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                placeholder="10-digit Indian Mobile"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Mobile</label>
              <input
                type="tel"
                placeholder="Optional"
                value={altMobile}
                onChange={e => setAltMobile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="customer@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {gstRegistered && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN *</label>
                <input
                  type="text"
                  placeholder="15-digit GSTIN (e.g. 36AAAFS...)"
                  value={gstin}
                  onChange={e => handleGstinChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required={gstRegistered}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PAN (Optional)</label>
              <input
                type="text"
                placeholder="10-digit PAN (e.g. AAAFS1234F)"
                value={pan}
                onChange={e => setPan(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address *</label>
            <textarea
              rows={2}
              placeholder="Door / Flat No., Street, Landmark, Locality"
              value={billingAddress}
              onChange={e => setBillingAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* Delivery Address checkbox */}
          <div>
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={sameAsBilling}
                onChange={e => setSameAsBilling(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span>Delivery address is same as billing address</span>
            </label>

            {!sameAsBilling && (
              <div className="mt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery / Shipping Address *
                </label>
                <textarea
                  rows={2}
                  placeholder="Delivery address if different from billing address"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required={!sameAsBilling}
                />
              </div>
            )}
          </div>

          {/* City, District, State, PIN Code */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                placeholder="e.g. Mylavaram"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                placeholder="e.g. NTR"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State & Code *</label>
              <select
                value={stateCode}
                onChange={e => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code *</label>
              <input
                type="text"
                placeholder="6-digit PIN"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Remarks</label>
            <input
              type="text"
              placeholder="e.g. Prefers morning delivery, referral by Ramesh..."
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 btn-interactive"
            >
              {isSubmitting ? 'Saving...' : initialCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
