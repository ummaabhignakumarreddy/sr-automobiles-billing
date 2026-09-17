import { TaxTreatment, PricingMode } from '../types/database.types';

export interface TaxLineCalculationInput {
  rate: number;
  quantity: number;
  discount: number;
  pricingMode: PricingMode;
  taxTreatment: TaxTreatment;
  gstRate: number; // e.g. 28 or 5
  cessRate: number; // e.g. 0 or 3
  supplierStateCode: string;
  placeOfSupplyStateCode: string;
}

export interface TaxLineCalculationResult {
  quantity: number;
  rate: number;
  grossAmount: number;
  discount: number;
  taxableValue: number;
  isIntraState: boolean;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessRate: number;
  cessAmount: number;
  totalAmount: number;
}

/**
 * Standard rounding to 2 decimal places to avoid floating-point imprecision
 */
export const round2 = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculate tax line item with precision and support for Tax-Inclusive and Tax-Exclusive pricing
 */
export const calculateTaxLine = (input: TaxLineCalculationInput): TaxLineCalculationResult => {
  const {
    rate,
    quantity,
    discount,
    pricingMode,
    taxTreatment,
    gstRate,
    cessRate,
    supplierStateCode,
    placeOfSupplyStateCode,
  } = input;

  const grossAmount = round2(rate * quantity);
  const netBeforeTax = Math.max(0, round2(grossAmount - discount));

  // Determine intra-state vs inter-state
  const cleanSupplierCode = (supplierStateCode || '').trim();
  const cleanPosCode = (placeOfSupplyStateCode || '').trim();
  const isIntraState = cleanSupplierCode !== '' && cleanSupplierCode === cleanPosCode;

  // Non-taxable or exempt lines
  if (taxTreatment === 'EXEMPT' || taxTreatment === 'NON_GST' || gstRate === 0) {
    return {
      quantity,
      rate,
      grossAmount,
      discount,
      taxableValue: netBeforeTax,
      isIntraState,
      gstRate: 0,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      cessRate: 0,
      cessAmount: 0,
      totalAmount: netBeforeTax,
    };
  }

  let taxableValue = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let cessAmount = 0;

  const effectiveGstRate = gstRate;
  const effectiveCessRate = cessRate || 0;
  const combinedTaxPercent = effectiveGstRate + effectiveCessRate;

  if (pricingMode === 'INCLUSIVE') {
    // Reverse calculate: NetPrice = TaxableValue * (1 + CombinedTax% / 100)
    // TaxableValue = NetPrice / (1 + CombinedTax% / 100)
    taxableValue = round2(netBeforeTax / (1 + combinedTaxPercent / 100));

    if (isIntraState) {
      const halfRate = effectiveGstRate / 2;
      cgstAmount = round2(taxableValue * (halfRate / 100));
      sgstAmount = round2(taxableValue * (halfRate / 100));
      igstAmount = 0;
    } else {
      cgstAmount = 0;
      sgstAmount = 0;
      igstAmount = round2(taxableValue * (effectiveGstRate / 100));
    }

    cessAmount = round2(taxableValue * (effectiveCessRate / 100));

    // Ensure total strictly matches netBeforeTax
    const calculatedTotal = round2(taxableValue + cgstAmount + sgstAmount + igstAmount + cessAmount);
    const diff = round2(netBeforeTax - calculatedTotal);
    if (diff !== 0) {
      // Adjust round-off discrepancy to taxable value to keep sum exact
      taxableValue = round2(taxableValue + diff);
    }
  } else {
    // Tax Exclusive pricing
    taxableValue = netBeforeTax;

    if (isIntraState) {
      const halfRate = effectiveGstRate / 2;
      cgstAmount = round2(taxableValue * (halfRate / 100));
      sgstAmount = round2(taxableValue * (halfRate / 100));
      igstAmount = 0;
    } else {
      cgstAmount = 0;
      sgstAmount = 0;
      igstAmount = round2(taxableValue * (effectiveGstRate / 100));
    }

    cessAmount = round2(taxableValue * (effectiveCessRate / 100));
  }

  const totalAmount = round2(taxableValue + cgstAmount + sgstAmount + igstAmount + cessAmount);

  return {
    quantity,
    rate,
    grossAmount,
    discount,
    taxableValue,
    isIntraState,
    gstRate: effectiveGstRate,
    cgstRate: isIntraState ? effectiveGstRate / 2 : 0,
    cgstAmount,
    sgstRate: isIntraState ? effectiveGstRate / 2 : 0,
    sgstAmount,
    igstRate: isIntraState ? 0 : effectiveGstRate,
    igstAmount,
    cessRate: effectiveCessRate,
    cessAmount,
    totalAmount,
  };
};

export interface InvoiceTotalsCalculationResult {
  grossAmount: number;
  discountAmount: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  otherTaxableCharges: number;
  nonTaxCharges: number;
  roundOff: number;
  grandTotal: number;
}

export const calculateInvoiceTotals = (
  lines: TaxLineCalculationResult[]
): InvoiceTotalsCalculationResult => {
  let grossAmount = 0;
  let discountAmount = 0;
  let taxableValue = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let cessAmount = 0;
  let otherTaxableCharges = 0;
  let nonTaxCharges = 0;

  lines.forEach(line => {
    grossAmount += line.grossAmount;
    discountAmount += line.discount;
    taxableValue += line.taxableValue;
    cgstAmount += line.cgstAmount;
    sgstAmount += line.sgstAmount;
    igstAmount += line.igstAmount;
    cessAmount += line.cessAmount;

    if (line.gstRate === 0) {
      nonTaxCharges += line.taxableValue;
    }
  });

  grossAmount = round2(grossAmount);
  discountAmount = round2(discountAmount);
  taxableValue = round2(taxableValue);
  cgstAmount = round2(cgstAmount);
  sgstAmount = round2(sgstAmount);
  igstAmount = round2(igstAmount);
  cessAmount = round2(cessAmount);
  nonTaxCharges = round2(nonTaxCharges);

  const rawGrandTotal = round2(taxableValue + cgstAmount + sgstAmount + igstAmount + cessAmount);
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = round2(roundedGrandTotal - rawGrandTotal);

  return {
    grossAmount,
    discountAmount,
    taxableValue,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cessAmount,
    otherTaxableCharges: round2(otherTaxableCharges),
    nonTaxCharges,
    roundOff,
    grandTotal: roundedGrandTotal,
  };
};
