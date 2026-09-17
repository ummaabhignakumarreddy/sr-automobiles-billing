import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES, getStateByCode } from '../lib/indianStates';
import { validateGSTIN, validateMobile, validatePincode } from '../lib/validators';
import {
  Settings,
  Building,
  CreditCard,
  Percent,
  FileCheck,
  RotateCcw,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, hsnList, addHsn, updateHsn, resetToDemoData, wipeAllData } = useAppData();
  const { isOwner } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'bank' | 'tax' | 'einvoice' | 'demo'>('profile');

  // Business profile state
  const [businessName, setBusinessName] = useState(settings.business_name);
  const [legalName, setLegalName] = useState(settings.legal_name);
  const [gstin, setGstin] = useState(settings.gstin);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [district, setDistrict] = useState(settings.district);
  const [stateCode, setStateCode] = useState(settings.state_code);
  const [pincode, setPincode] = useState(settings.pincode);
  const [phone, setPhone] = useState(settings.phone);
  const [altPhone, setAltPhone] = useState(settings.alt_phone || '');
  const [email, setEmail] = useState(settings.email);
  const [website, setWebsite] = useState(settings.website || '');
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoice_prefix || 'SRA');
  const [authorizedSignatory, setAuthorizedSignatory] = useState(settings.authorized_signatory);
  const [terms, setTerms] = useState(settings.terms_and_conditions);

  // Bank state
  const [bankName, setBankName] = useState(settings.bank_name);
  const [accountHolder, setAccountHolder] = useState(settings.account_holder);
  const [accountNumber, setAccountNumber] = useState(settings.account_number);
  const [ifsc, setIfsc] = useState(settings.ifsc);
  const [upiId, setUpiId] = useState(settings.upi_id);

  // E-Invoice & E-Way Bill Readiness
  const [einvoiceApplicable, setEinvoiceApplicable] = useState(settings.einvoice_applicable);
  const [ewayBillApplicable, setEwayBillApplicable] = useState(settings.eway_bill_applicable);

  // New HSN line modal
  const [isAddHsnOpen, setIsAddHsnOpen] = useState(false);
  const [newHsnCode, setNewHsnCode] = useState('');
  const [newHsnDesc, setNewHsnDesc] = useState('');
  const [newHsnCat, setNewHsnCat] = useState('Vehicle');
  const [newHsnGst, setNewHsnGst] = useState<number>(28);
  const [newHsnCess, setNewHsnCess] = useState<number>(0);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation: only validate GSTIN if entered
    if (gstin.trim()) {
      const gstinCheck = validateGSTIN(gstin, stateCode);
      if (!gstinCheck.isValid) {
        return setMessage({ text: gstinCheck.error || 'Invalid GSTIN', type: 'error' });
      }
    }

    const stateObj = getStateByCode(stateCode);
    const stateName = stateObj ? stateObj.name : settings.state;

    try {
      await updateSettings({
        business_name: businessName.trim(),
        legal_name: legalName.trim(),
        gstin: gstin.trim().toUpperCase(),
        address: address.trim(),
        city: city.trim(),
        district: district.trim(),
        state: stateName,
        state_code: stateCode,
        pincode: pincode.trim(),
        phone: phone.trim(),
        alt_phone: altPhone.trim() || undefined,
        email: email.trim(),
        website: website.trim() || undefined,
        invoice_prefix: invoicePrefix.trim().toUpperCase(),
        authorized_signatory: authorizedSignatory.trim(),
        terms_and_conditions: terms.trim(),
      });
      setMessage({ text: 'Dealership profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update settings', type: 'error' });
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await updateSettings({
        bank_name: bankName.trim(),
        account_holder: accountHolder.trim(),
        account_number: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        upi_id: upiId.trim(),
      });
      setMessage({ text: 'Bank details updated successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update bank details', type: 'error' });
    }
  };

  const handleSaveEinvoice = async () => {
    try {
      await updateSettings({
        einvoice_applicable: einvoiceApplicable,
        eway_bill_applicable: ewayBillApplicable,
      });
      setMessage({ text: 'Compliance readiness settings saved!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Save failed', type: 'error' });
    }
  };

  const handleAddHsn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHsnCode.trim() || !newHsnDesc.trim()) return;

    await addHsn({
      hsn_code: newHsnCode.trim(),
      description: newHsnDesc.trim(),
      category: newHsnCat,
      default_gst_rate: newHsnGst,
      default_cess_rate: newHsnCess,
      is_active: true,
    });

    setNewHsnCode('');
    setNewHsnDesc('');
    setIsAddHsnOpen(false);
    setMessage({ text: 'New HSN Rate Code added successfully!', type: 'success' });
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dealership & Business Settings</h2>
        <p className="text-xs text-slate-500">
          Maintain SR Automobiles dealership identity, bank settlement accounts, GSTIN, and tax master
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-2 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
            activeTab === 'profile'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Dealership Identity</span>
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
            activeTab === 'bank'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bank & UPI Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
            activeTab === 'tax'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Tax & HSN Master</span>
        </button>

        <button
          onClick={() => setActiveTab('einvoice')}
          className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
            activeTab === 'einvoice'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>E-Invoice / E-Way Bill</span>
        </button>

        <button
          onClick={() => setActiveTab('demo')}
          className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
            activeTab === 'demo'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Data Maintenance</span>
        </button>
      </div>

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Legal / Trade Name *</label>
              <input
                type="text"
                value={legalName}
                onChange={e => setLegalName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN (Optional / 15 Chars)</label>
              <input
                type="text"
                placeholder="e.g. 37AAAAA0000A1Z5"
                value={gstin}
                onChange={e => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Showroom / Dealership Address *</label>
            <textarea
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State & State Code *</label>
              <select
                value={stateCode}
                onChange={e => setStateCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
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
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Phone</label>
              <input
                type="text"
                value={altPhone}
                onChange={e => setAltPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email (Optional)</label>
              <input
                type="email"
                placeholder="contact@srautomobiles.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix *</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={e => setInvoicePrefix(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase"
                required
              />
              <span className="text-[10px] text-slate-500">
                Forms invoice numbers like: <strong>{invoicePrefix}/26-27/0001</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Authorized Signatory Name *</label>
              <input
                type="text"
                value={authorizedSignatory}
                onChange={e => setAuthorizedSignatory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Terms & Conditions (Printed on Invoices)</label>
            <textarea
              rows={4}
              value={terms}
              onChange={e => setTerms(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Dealership Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Bank Details Form */}
      {activeTab === 'bank' && (
        <form onSubmit={handleSaveBank} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. State Bank of India"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. SR AUTOMOBILES"
                value={accountHolder}
                onChange={e => setAccountHolder(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number (Optional)</label>
              <input
                type="text"
                placeholder="Account Number"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. SBIN0012345"
                value={ifsc}
                onChange={e => setIfsc(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID for Direct QR Billing (Optional)</label>
              <input
                type="text"
                placeholder="e.g. srautomobiles@upi"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Bank Account</span>
            </button>
          </div>
        </form>
      )}

      {/* Tax & HSN Master */}
      {activeTab === 'tax' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">HSN Master & Configured Tax Rates</h3>
              <p className="text-xs text-slate-500">
                Configurable rates for 2-wheelers, EV scooters, accessories, and services. Historical invoices preserve their original rates.
              </p>
            </div>
            <button
              onClick={() => setIsAddHsnOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add HSN Code</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">HSN / SAC Code</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">GST Rate (%)</th>
                  <th className="p-3 text-center">Cess Rate (%)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hsnList.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{h.hsn_code}</td>
                    <td className="p-3 text-slate-700">{h.description}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                        {h.category}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-900">{h.default_gst_rate}%</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-900">{h.default_cess_rate}%</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add HSN Modal */}
          {isAddHsnOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Add New HSN / SAC Rate</h4>
                <form onSubmit={handleAddHsn} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">HSN Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. 871190"
                      value={newHsnCode}
                      onChange={e => setNewHsnCode(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Description *</label>
                    <input
                      type="text"
                      placeholder="e.g. Electric Tricycles"
                      value={newHsnDesc}
                      onChange={e => setNewHsnDesc(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">GST Rate (%) *</label>
                      <input
                        type="number"
                        value={newHsnGst}
                        onChange={e => setNewHsnGst(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Cess Rate (%)</label>
                      <input
                        type="number"
                        value={newHsnCess}
                        onChange={e => setNewHsnCess(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAddHsnOpen(false)}
                      className="px-3 py-1.5 border rounded-lg"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-1.5 bg-red-600 text-white rounded-lg font-bold">
                      Add HSN
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* E-Invoice & E-Way Bill Readiness */}
      {activeTab === 'einvoice' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Government Portal Readiness</h3>
            <p className="text-xs text-slate-500">
              Configure statutory applicability for B2B e-invoicing and e-way bill generation
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-900">GST e-Invoicing Mandatory for Dealership</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Applies if aggregate business turnover exceeds government notification thresholds. (Does not generate fake IRNs or fake QR codes).
                </p>
              </div>
              <input
                type="checkbox"
                checked={einvoiceApplicable}
                onChange={e => setEinvoiceApplicable(e.target.checked)}
                className="w-5 h-5 rounded text-red-600 focus:ring-red-500"
              />
            </div>

            <div className="flex items-start justify-between pt-3 border-t border-slate-200">
              <div>
                <p className="font-bold text-slate-900">E-Way Bill Generation Required</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  For consignment movements of goods exceeding statutory limits (₹50,000 / state specific limit).
                </p>
              </div>
              <input
                type="checkbox"
                checked={ewayBillApplicable}
                onChange={e => setEwayBillApplicable(e.target.checked)}
                className="w-5 h-5 rounded text-red-600 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSaveEinvoice}
              className="flex items-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Portal Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Data Maintenance & Reset */}
      {activeTab === 'demo' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs animate-fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Database Maintenance & System Reset</h3>
            <p className="text-xs text-slate-500">
              Manage database records, purge cache, or restore clean state for production billing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900">Reset System to Clean Defaults</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Resets business configuration to official SR AUTOMOBILES dealership details, restores standard GST HSN codes, and ensures zero inventory or customer demo records.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset settings to official defaults? Inventory and customer records will remain empty.')) {
                    resetToDemoData();
                    setMessage({ text: 'System reset to clean official defaults!', type: 'success' });
                  }
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center space-x-2 btn-interactive"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Clean Defaults</span>
              </button>
            </div>

            <div className="p-4 border border-red-200 bg-red-50/30 rounded-xl space-y-3">
              <h4 className="font-bold text-red-950">Wipe All Records for Clean Production</h4>
              <p className="text-red-800 text-[11px] leading-relaxed">
                Clears all vehicles, customers, invoices, and sequence counters from local storage. Leaves a completely empty database ready for live operation.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('WARNING: This will permanently wipe all vehicle inventory, customers, and invoice records. Proceed?')) {
                    wipeAllData();
                    setMessage({ text: 'All database records wiped cleanly!', type: 'success' });
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs flex items-center space-x-2 btn-interactive"
              >
                <Trash2 className="w-4 h-4" />
                <span>Wipe All Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
