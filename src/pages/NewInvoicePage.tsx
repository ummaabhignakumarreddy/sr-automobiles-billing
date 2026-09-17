import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import {
  Vehicle,
  Customer,
  Invoice,
  InvoiceItem,
  PricingMode,
  PaymentMode,
  TaxTreatment,
  PaymentRecord,
} from '../types/database.types';
import { calculateTaxLine, calculateInvoiceTotals } from '../lib/gstEngine';
import { formatINR, formatDateIndian } from '../lib/formatters';
import { numberToWordsIndian } from '../lib/currencyWords';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { PrintableInvoice } from '../components/invoice/PrintableInvoice';
import {
  Bike,
  User,
  Users,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  FileCheck,
  CreditCard,
  Building,
  AlertTriangle,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface NewInvoicePageProps {
  onInvoiceFinalized?: (invoice: Invoice) => void;
}

export const NewInvoicePage: React.FC<NewInvoicePageProps> = ({ onInvoiceFinalized }) => {
  const { settings, vehicles, customers, createInvoice, finalizeInvoice, getNextInvoiceNumberPreview, hsnList } = useAppData();
  const { user } = useAuth();

  // Active steps or states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Pricing Mode: EXCLUSIVE or INCLUSIVE
  const [pricingMode, setPricingMode] = useState<PricingMode>('EXCLUSIVE');

  // Primary Vehicle Line Pricing
  const [vehicleRate, setVehicleRate] = useState<number>(0);
  const [vehicleDiscount, setVehicleDiscount] = useState<number>(0);
  const [vehicleGstRate, setVehicleGstRate] = useState<number>(28);
  const [vehicleCessRate, setVehicleCessRate] = useState<number>(0);

  // Place of Supply State Code (Defaults to customer's state code, or dealership's state code)
  const [posStateCode, setPosStateCode] = useState<string>(settings.state_code);
  const [posStateName, setPosStateName] = useState<string>(settings.state);

  // Additional Charges Lines
  const [additionalItems, setAdditionalItems] = useState<
    Array<{
      id: string;
      description: string;
      hsn_sac: string;
      quantity: number;
      rate: number;
      discount: number;
      tax_treatment: TaxTreatment;
      gst_rate: number;
      cess_rate: number;
    }>
  >([]);

  // Split Payments List
  const [payments, setPayments] = useState<
    Array<{
      id: string;
      payment_date: string;
      amount: number;
      payment_mode: PaymentMode;
      reference_number?: string;
      finance_company?: string;
      loan_application_ref?: string;
      customer_contribution?: number;
      notes?: string;
    }>
  >([]);

  // Payment form draft input
  const [newPayMode, setNewPayMode] = useState<PaymentMode>('UPI');
  const [newPayAmount, setNewPayAmount] = useState<string>('');
  const [newPayRef, setNewPayRef] = useState<string>('');
  const [newPayFinanceCo, setNewPayFinanceCo] = useState<string>('');
  const [newPayLoanRef, setNewPayLoanRef] = useState<string>('');
  const [newPayContribution, setNewPayContribution] = useState<string>('');

  // Confirmation Modal & Finalized Invoice
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalizedInvoice, setFinalizedInvoice] = useState<Invoice | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Selected Entities
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  // Available vehicles for sale: strictly IN_STOCK or BOOKED
  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => v.stock_status === 'IN_STOCK' || v.stock_status === 'BOOKED');
  }, [vehicles]);

  // Update POS when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      setPosStateCode(selectedCustomer.state_code);
      setPosStateName(selectedCustomer.state);
    } else {
      setPosStateCode(settings.state_code);
      setPosStateName(settings.state);
    }
  }, [selectedCustomer, settings]);

  // Update vehicle pricing defaults when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      setVehicleRate(selectedVehicle.default_selling_price);
      setVehicleDiscount(0);
      setVehicleGstRate(selectedVehicle.default_gst_rate);
      setVehicleCessRate(selectedVehicle.default_cess_rate || 0);
    }
  }, [selectedVehicle]);

  // Compute Live Tax Calculations for All Lines
  const { lineCalculations, invoiceTotals } = useMemo(() => {
    if (!selectedVehicle) {
      return {
        lineCalculations: [],
        invoiceTotals: {
          grossAmount: 0,
          discountAmount: 0,
          taxableValue: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          cessAmount: 0,
          otherTaxableCharges: 0,
          nonTaxCharges: 0,
          roundOff: 0,
          grandTotal: 0,
        },
      };
    }

    // 1. Vehicle Primary Line
    const vehicleLineCalc = calculateTaxLine({
      rate: vehicleRate,
      quantity: 1,
      discount: vehicleDiscount,
      pricingMode,
      taxTreatment: 'TAXABLE',
      gstRate: vehicleGstRate,
      cessRate: vehicleCessRate,
      supplierStateCode: settings.state_code,
      placeOfSupplyStateCode: posStateCode,
    });

    const lines = [vehicleLineCalc];

    // 2. Additional Lines
    additionalItems.forEach(item => {
      const calc = calculateTaxLine({
        rate: item.rate,
        quantity: item.quantity,
        discount: item.discount,
        pricingMode,
        taxTreatment: item.tax_treatment,
        gstRate: item.tax_treatment === 'TAXABLE' ? item.gst_rate : 0,
        cessRate: item.tax_treatment === 'TAXABLE' ? item.cess_rate : 0,
        supplierStateCode: settings.state_code,
        placeOfSupplyStateCode: posStateCode,
      });
      lines.push(calc);
    });

    const totals = calculateInvoiceTotals(lines);

    return { lineCalculations: lines, invoiceTotals: totals };
  }, [
    selectedVehicle,
    vehicleRate,
    vehicleDiscount,
    vehicleGstRate,
    vehicleCessRate,
    pricingMode,
    settings.state_code,
    posStateCode,
    additionalItems,
  ]);

  // Payment totals
  const totalPaid = useMemo(() => {
    return payments.reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const balanceAmount = useMemo(() => {
    return Math.max(0, invoiceTotals.grandTotal - totalPaid);
  }, [invoiceTotals.grandTotal, totalPaid]);

  // Helper to add an additional line item
  const handleAddAdditionalCharge = () => {
    setAdditionalItems(prev => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        description: 'Accessories / Helmet / Crash Guard',
        hsn_sac: '871410',
        quantity: 1,
        rate: 1500,
        discount: 0,
        tax_treatment: 'TAXABLE',
        gst_rate: 28,
        cess_rate: 0,
      },
    ]);
  };

  const handleRemoveAdditionalCharge = (id: string) => {
    setAdditionalItems(prev => prev.filter(item => item.id !== id));
  };

  // Helper to add a payment slice
  const handleAddPayment = () => {
    const num = Number(newPayAmount);
    if (isNaN(num) || num <= 0) return;

    const paymentEntry = {
      id: `pay-${Date.now()}`,
      payment_date: new Date().toISOString().split('T')[0],
      amount: num,
      payment_mode: newPayMode,
      reference_number: newPayRef.trim() || undefined,
      finance_company: newPayMode === 'FINANCE' ? newPayFinanceCo.trim() || undefined : undefined,
      loan_application_ref: newPayMode === 'FINANCE' ? newPayLoanRef.trim() || undefined : undefined,
      customer_contribution: newPayMode === 'FINANCE' && newPayContribution ? Number(newPayContribution) : undefined,
    };

    setPayments(prev => [...prev, paymentEntry]);
    setNewPayAmount('');
    setNewPayRef('');
    setNewPayFinanceCo('');
    setNewPayLoanRef('');
    setNewPayContribution('');
  };

  const handleRemovePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  // Set default full payment with 1-click
  const handleFillFullPayment = (mode: PaymentMode) => {
    if (balanceAmount <= 0) return;
    setNewPayMode(mode);
    setNewPayAmount(String(balanceAmount));
  };

  // Pre-Finalization Validation
  const handleOpenConfirmModal = () => {
    setValidationError(null);

    if (!selectedCustomer) {
      return setValidationError('Please select or create a Customer before proceeding.');
    }
    if (!selectedVehicle) {
      return setValidationError('Please select a Vehicle from available stock.');
    }
    if (selectedVehicle.stock_status === 'SOLD') {
      return setValidationError(`Vehicle VIN ${selectedVehicle.vin_chassis} has already been SOLD!`);
    }
    if (vehicleRate <= 0) {
      return setValidationError('Vehicle rate must be greater than 0.');
    }

    setIsConfirmModalOpen(true);
  };

  // Execute Finalization
  const handleFinalizeInvoice = async () => {
    if (!selectedCustomer || !selectedVehicle) return;

    setIsSubmitting(true);
    setValidationError(null);

    try {
      // Build invoice items array
      const itemsList: InvoiceItem[] = [
        {
          id: `item-veh-${Date.now()}`,
          item_type: 'VEHICLE',
          description: `${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.variant} - ${selectedVehicle.colour}`,
          hsn_sac: selectedVehicle.hsn_code,
          quantity: 1,
          unit: 'NOS',
          rate: vehicleRate,
          discount: vehicleDiscount,
          taxable_value: lineCalculations[0].taxableValue,
          tax_treatment: 'TAXABLE',
          gst_rate: lineCalculations[0].gstRate,
          cgst_rate: lineCalculations[0].cgstRate,
          cgst_amount: lineCalculations[0].cgstAmount,
          sgst_rate: lineCalculations[0].sgstRate,
          sgst_amount: lineCalculations[0].sgstAmount,
          igst_rate: lineCalculations[0].igstRate,
          igst_amount: lineCalculations[0].igstAmount,
          cess_rate: lineCalculations[0].cessRate,
          cess_amount: lineCalculations[0].cessAmount,
          total_amount: lineCalculations[0].totalAmount,
        },
      ];

      // Additional lines
      additionalItems.forEach((item, idx) => {
        const calc = lineCalculations[idx + 1];
        itemsList.push({
          id: `item-add-${Date.now()}-${idx}`,
          item_type: 'ADDITIONAL',
          description: item.description,
          hsn_sac: item.hsn_sac,
          quantity: item.quantity,
          unit: 'NOS',
          rate: item.rate,
          discount: item.discount,
          taxable_value: calc.taxableValue,
          tax_treatment: item.tax_treatment,
          gst_rate: calc.gstRate,
          cgst_rate: calc.cgstRate,
          cgst_amount: calc.cgstAmount,
          sgst_rate: calc.sgstRate,
          sgst_amount: calc.sgstAmount,
          igst_rate: calc.igstRate,
          igst_amount: calc.igstAmount,
          cess_rate: calc.cessRate,
          cess_amount: calc.cessAmount,
          total_amount: calc.totalAmount,
        });
      });

      const paymentStatus = balanceAmount <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

      const createRes = await createInvoice({
        invoice_date: new Date().toISOString().split('T')[0],
        place_of_supply: posStateName,
        place_of_supply_state_code: posStateCode,
        reverse_charge: false,
        pricing_mode: pricingMode,
        status: 'FINALIZED',
        customer_id: selectedCustomer.id,
        vehicle_id: selectedVehicle.id,
        customer_snapshot: selectedCustomer,
        vehicle_snapshot: selectedVehicle,
        business_snapshot: {
          ...settings,
          gstin: settings.gstin?.trim() || '37CGEPN8682D1Z1',
          district: settings.district || 'NTR',
        },
        items: itemsList,
        payments: payments.map(p => ({ ...p, invoice_id: '' })),
        gross_amount: invoiceTotals.grossAmount,
        discount_amount: invoiceTotals.discountAmount,
        taxable_value: invoiceTotals.taxableValue,
        cgst_amount: invoiceTotals.cgstAmount,
        sgst_amount: invoiceTotals.sgstAmount,
        igst_amount: invoiceTotals.igstAmount,
        cess_amount: invoiceTotals.cessAmount,
        other_charges: invoiceTotals.nonTaxCharges,
        non_tax_charges: invoiceTotals.nonTaxCharges,
        round_off: invoiceTotals.roundOff,
        grand_total: invoiceTotals.grandTotal,
        total_paid: totalPaid,
        balance_amount: balanceAmount,
        payment_status: paymentStatus,
        created_by: user?.id,
      });

      if (!createRes.success || !createRes.invoice) {
        setValidationError(createRes.error || 'Failed to finalize invoice.');
        setIsSubmitting(false);
        setIsConfirmModalOpen(false);
        return;
      }

      setFinalizedInvoice(createRes.invoice);
      setIsConfirmModalOpen(false);
      if (onInvoiceFinalized) onInvoiceFinalized(createRes.invoice);
    } catch (err: any) {
      setValidationError(err.message || 'Invoice finalization error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already finalized, show Printable Tax Invoice immediately
  if (finalizedInvoice) {
    return (
      <div className="p-6">
        <div className="no-print mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Tax Invoice {finalizedInvoice.invoice_number} Finalized Successfully!
              </h3>
              <p className="text-xs text-emerald-700">
                Vehicle stock status updated to <strong>SOLD</strong>. Print or download the official A4 document below.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFinalizedInvoice(null);
              setSelectedCustomerId('');
              setSelectedVehicleId('');
              setPayments([]);
              setAdditionalItems([]);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Create Another Invoice
          </button>
        </div>

        <PrintableInvoice invoice={finalizedInvoice} />
      </div>
    );
  }

  const isIntraState = settings.state_code === posStateCode;
  const nextInvoicePreview = getNextInvoiceNumberPreview();

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">New Vehicle Sales Invoice</h2>
          <p className="text-xs text-slate-500">
            Guided Indian GST billing workflow. Tax treatment dynamically adapts to Place of Supply.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200">
          <span className="text-[11px] text-slate-500">Consecutive Invoice No:</span>
          <span className="font-mono font-bold text-slate-900 text-xs">{nextInvoicePreview}</span>
        </div>
      </div>

      {validationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP 1: Select Customer */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-slate-900">Select or Register Customer</h3>
          </div>
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Customer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Search & Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-500"
            >
              <option value="">-- Choose Customer from Directory --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.mobile}) - {c.city}, {c.state} {c.gst_registered ? `[GSTIN: ${c.gstin}]` : '[Retail]'}
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-fade-in">
                <span>No customers registered in the database yet.</span>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="font-bold text-red-600 hover:text-red-700 underline inline-flex items-center space-x-1 btn-interactive"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add First Customer</span>
                </button>
              </div>
            )}
          </div>

          {selectedCustomer && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
                <span className="font-mono text-slate-600">{selectedCustomer.mobile}</span>
              </div>
              <p className="text-slate-600">{selectedCustomer.billing_address}, {selectedCustomer.city}</p>
              <div className="flex items-center space-x-3 text-[11px] pt-1">
                <span className="font-medium text-slate-700">
                  POS: <strong>{posStateName} ({posStateCode})</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className={`font-semibold ${isIntraState ? 'text-emerald-700' : 'text-blue-700'}`}>
                  {isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP 2: Select Vehicle */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
            2
          </span>
          <h3 className="text-sm font-bold text-slate-900">Select Physical Vehicle (Individual Unit)</h3>
          <span className="text-xs text-slate-500">
            (Only units in stock or booked are eligible for billing)
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Choose Available Vehicle *
          </label>
          <select
            value={selectedVehicleId}
            onChange={e => setSelectedVehicleId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-500"
          >
            <option value="">-- Choose Unit by VIN / Chassis Number --</option>
            {availableVehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} {v.variant} ({v.colour}) - VIN: {v.vin_chassis} - Base: {formatINR(v.default_selling_price)} [{v.stock_status}]
              </option>
            ))}
          </select>
          {availableVehicles.length === 0 && (
            <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 animate-fade-in">
              <p className="font-bold">No vehicles currently available in inventory.</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Go to the <strong>Vehicles</strong> inventory tab and click <strong>Add Vehicle</strong> to register new stock units before billing.
              </p>
            </div>
          )}
        </div>

        {selectedVehicle && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Model</span>
                <span className="font-bold text-slate-900">{selectedVehicle.brand} {selectedVehicle.model}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Variant & Colour</span>
                <span className="font-bold text-slate-900">{selectedVehicle.variant} ({selectedVehicle.colour})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">CHASSIS / VIN</span>
                <span className="font-mono font-black text-slate-950">{selectedVehicle.vin_chassis}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                  {selectedVehicle.fuel_type === 'Electric' ? 'MOTOR NO' : 'ENGINE NO'}
                </span>
                <span className="font-mono font-bold text-slate-950">
                  {selectedVehicle.fuel_type === 'Electric' ? selectedVehicle.motor_number : selectedVehicle.engine_number}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: Pricing & GST Engine Configuration */}
      {selectedVehicle && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900">Vehicle Pricing & GST Calculations</h3>
            </div>

            {/* Tax Exclusive vs Tax Inclusive Pricing Mode Toggle */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPricingMode('EXCLUSIVE')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  pricingMode === 'EXCLUSIVE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tax Exclusive
              </button>
              <button
                type="button"
                onClick={() => setPricingMode('INCLUSIVE')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  pricingMode === 'INCLUSIVE'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tax Inclusive
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Selling Rate (₹) *
              </label>
              <input
                type="number"
                value={vehicleRate}
                onChange={e => setVehicleRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-red-500"
              />
              <span className="text-[10px] text-slate-500">
                {pricingMode === 'INCLUSIVE' ? 'Price includes GST' : 'Price before GST'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount (₹)</label>
              <input
                type="number"
                value={vehicleDiscount}
                onChange={e => setVehicleDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate (%)</label>
              <input
                type="number"
                value={vehicleGstRate}
                onChange={e => setVehicleGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500"
              />
              <span className="text-[10px] text-slate-500">
                {selectedVehicle.fuel_type === 'Electric' ? 'EV 5%' : 'Petrol 28%'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cess Rate (%)</label>
              <input
                type="number"
                value={vehicleCessRate}
                onChange={e => setVehicleCessRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Additional Charges & Accessories */}
      {selectedVehicle && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="text-sm font-bold text-slate-900">Additional Charges & Services</h3>
            </div>
            <button
              type="button"
              onClick={handleAddAdditionalCharge}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          {additionalItems.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No additional charges added. You can add accessories, extended warranty, logistics/handling or insurance.
            </p>
          ) : (
            <div className="space-y-3">
              {additionalItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 items-end text-xs"
                >
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => {
                        const val = e.target.value;
                        setAdditionalItems(prev =>
                          prev.map(it => (it.id === item.id ? { ...it, description: val } : it))
                        );
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">HSN/SAC</label>
                    <input
                      type="text"
                      value={item.hsn_sac}
                      onChange={e => {
                        const val = e.target.value;
                        setAdditionalItems(prev =>
                          prev.map(it => (it.id === item.id ? { ...it, hsn_sac: val } : it))
                        );
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Value (₹)</label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setAdditionalItems(prev =>
                          prev.map(it => (it.id === item.id ? { ...it, rate: val } : it))
                        );
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tax Treatment</label>
                    <select
                      value={item.tax_treatment}
                      onChange={e => {
                        const val = e.target.value as TaxTreatment;
                        setAdditionalItems(prev =>
                          prev.map(it => (it.id === item.id ? { ...it, tax_treatment: val } : it))
                        );
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="TAXABLE">Taxable (28%)</option>
                      <option value="EXEMPT">Exempt (0%)</option>
                      <option value="NON_GST">Non-GST (0%)</option>
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">GST %</label>
                    <input
                      type="number"
                      disabled={item.tax_treatment !== 'TAXABLE'}
                      value={item.tax_treatment === 'TAXABLE' ? item.gst_rate : 0}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setAdditionalItems(prev =>
                          prev.map(it => (it.id === item.id ? { ...it, gst_rate: val } : it))
                        );
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveAdditionalCharge(item.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 5: Payment Details & Split Allocation */}
      {selectedVehicle && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
              5
            </span>
            <h3 className="text-sm font-bold text-slate-900">Payment Breakdown & Settlement</h3>
            <span className="text-xs text-slate-500">(Supports multi-mode & vehicle financing)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Payment Add Box */}
            <div className="md:col-span-7 space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Add Payment Allocation
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={newPayMode}
                    onChange={e => setNewPayMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="FINANCE">Vehicle Auto Loan / Finance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={newPayAmount}
                    onChange={e => setNewPayAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reference / Transaction / UTR No.
                </label>
                <input
                  type="text"
                  placeholder="Optional reference number"
                  value={newPayRef}
                  onChange={e => setNewPayRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              {/* Finance details */}
              {newPayMode === 'FINANCE' && (
                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 space-y-2">
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                    Financing Institution Details
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank, L&T Finance"
                      value={newPayFinanceCo}
                      onChange={e => setNewPayFinanceCo(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Loan Sanction Ref No."
                      value={newPayLoanRef}
                      onChange={e => setNewPayLoanRef(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleFillFullPayment('UPI')}
                    className="text-[11px] text-red-600 font-semibold hover:underline"
                  >
                    Pay Full with UPI
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleFillFullPayment('CASH')}
                    className="text-[11px] text-red-600 font-semibold hover:underline"
                  >
                    Pay Full with Cash
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddPayment}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  + Add Payment
                </button>
              </div>
            </div>

            {/* Payments List */}
            <div className="md:col-span-5 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Recorded Payments ({payments.length})
              </h4>

              {payments.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  No payment recorded yet. (Invoice will be marked UNPAID if finalized without payment).
                </p>
              ) : (
                <div className="space-y-2">
                  {payments.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">{p.payment_mode}</span>
                          {p.reference_number && (
                            <span className="font-mono text-[10px] text-slate-500">({p.reference_number})</span>
                          )}
                        </div>
                        {p.finance_company && (
                          <p className="text-[10px] text-blue-700 font-medium">
                            {p.finance_company} - Ref: {p.loan_application_ref || 'N/A'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-700">{formatINR(p.amount)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(p.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Balance Card */}
              <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Paid:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatINR(totalPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Balance Due:</span>
                  <span className={`font-mono font-bold ${balanceAmount > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                    {formatINR(balanceAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Totals & Final Confirmation Bar */}
      {selectedVehicle && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <span>Taxable Value: <strong className="text-white font-mono">{formatINR(invoiceTotals.taxableValue)}</strong></span>
              {isIntraState ? (
                <>
                  <span>CGST: <strong className="text-white font-mono">{formatINR(invoiceTotals.cgstAmount)}</strong></span>
                  <span>SGST: <strong className="text-white font-mono">{formatINR(invoiceTotals.sgstAmount)}</strong></span>
                </>
              ) : (
                <span>IGST: <strong className="text-white font-mono">{formatINR(invoiceTotals.igstAmount)}</strong></span>
              )}
              {invoiceTotals.cessAmount > 0 && (
                <span>Cess: <strong className="text-white font-mono">{formatINR(invoiceTotals.cessAmount)}</strong></span>
              )}
              <span>Round Off: <strong className="text-white font-mono">{formatINR(invoiceTotals.roundOff)}</strong></span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-white pt-1">
              GRAND TOTAL: {formatINR(invoiceTotals.grandTotal)}
            </div>
            <p className="text-[11px] text-slate-400 font-serif italic">
              {numberToWordsIndian(invoiceTotals.grandTotal)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenConfirmModal}
            className="w-full md:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-red-950/60 transition-all shrink-0 flex items-center justify-center space-x-2 btn-interactive"
          >
            <Receipt className="w-4 h-4" />
            <span>Generate & Finalize Invoice</span>
          </button>
        </div>
      )}

      {/* Finalization Confirmation Modal */}
      {isConfirmModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-scale-in">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Confirm & Finalize Tax Invoice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Next sequential number: <strong>{nextInvoicePreview}</strong>
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <p className="font-bold mb-0.5">Finalization Notice:</p>
                  <p className="text-[11px] leading-relaxed">
                    Once finalized, this invoice becomes a legal GST Tax Invoice. Critical fields cannot be casually edited. The physical vehicle (VIN: <strong>{selectedVehicle?.vin_chassis}</strong>) will be marked as <strong>SOLD</strong>.
                  </p>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Customer:</span>
                    <span className="font-bold text-slate-900">{selectedCustomer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Vehicle Model:</span>
                    <span className="font-bold text-slate-900">{selectedVehicle?.brand} {selectedVehicle?.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Chassis / VIN:</span>
                    <span className="font-mono font-bold text-slate-950">{selectedVehicle?.vin_chassis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Place of Supply:</span>
                    <span className="font-semibold text-slate-900">{posStateName} ({posStateCode})</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-700 font-bold">Grand Total:</span>
                    <span className="font-mono font-black text-slate-950 text-sm">{formatINR(invoiceTotals.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Paid:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatINR(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Balance Due:</span>
                    <span className="font-mono font-bold text-red-700">{formatINR(balanceAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors btn-interactive"
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalizeInvoice}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors disabled:opacity-50 btn-interactive"
                >
                  {isSubmitting ? 'Finalizing...' : 'FINALIZE & GENERATE TAX INVOICE'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Customer Create Modal */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={cust => {
          setSelectedCustomerId(cust.id);
        }}
      />
    </div>
  );
};
