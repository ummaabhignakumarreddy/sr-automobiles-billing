import { describe, it, expect } from 'vitest';
import { calculateTaxLine, calculateInvoiceTotals } from '../lib/gstEngine';
import { numberToWordsIndian } from '../lib/currencyWords';
import { getIndianFinancialYear, formatInvoiceNumber } from '../lib/invoiceSequence';
import { validateGSTIN, validateMobile, validatePincode } from '../lib/validators';

describe('GST Calculation Engine', () => {
  it('correctly calculates Intra-State tax (CGST + SGST) for Andhra Pradesh to Andhra Pradesh', () => {
    // Hero Splendor at ₹79,900 rate, 28% GST, Intra-state (37 to 37)
    const result = calculateTaxLine({
      rate: 79900,
      quantity: 1,
      discount: 0,
      pricingMode: 'EXCLUSIVE',
      taxTreatment: 'TAXABLE',
      gstRate: 28,
      cessRate: 0,
      supplierStateCode: '37',
      placeOfSupplyStateCode: '37',
    });

    expect(result.isIntraState).toBe(true);
    expect(result.taxableValue).toBe(79900);
    expect(result.cgstRate).toBe(14);
    expect(result.sgstRate).toBe(14);
    expect(result.igstRate).toBe(0);
    expect(result.cgstAmount).toBe(11186);
    expect(result.sgstAmount).toBe(11186);
    expect(result.igstAmount).toBe(0);
    expect(result.totalAmount).toBe(102272);
  });

  it('correctly calculates Inter-State tax (IGST) for Andhra Pradesh to Telangana', () => {
    // Royal Enfield Classic 350 at ₹1,95,000 rate, 28% GST + 3% Cess, Inter-state (37 to 36)
    const result = calculateTaxLine({
      rate: 195000,
      quantity: 1,
      discount: 5000,
      pricingMode: 'EXCLUSIVE',
      taxTreatment: 'TAXABLE',
      gstRate: 28,
      cessRate: 3,
      supplierStateCode: '37',
      placeOfSupplyStateCode: '36',
    });

    expect(result.isIntraState).toBe(false);
    expect(result.taxableValue).toBe(190000); // 195000 - 5000 discount
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.igstRate).toBe(28);
    expect(result.igstAmount).toBe(53200); // 190000 * 28%
    expect(result.cessRate).toBe(3);
    expect(result.cessAmount).toBe(5700); // 190000 * 3%
    expect(result.totalAmount).toBe(248900);
  });

  it('correctly reverse calculates Tax-Inclusive pricing', () => {
    // Ather EV scooter at ₹1,42,000 inclusive of 5% GST (Intra-state)
    const result = calculateTaxLine({
      rate: 142000,
      quantity: 1,
      discount: 0,
      pricingMode: 'INCLUSIVE',
      taxTreatment: 'TAXABLE',
      gstRate: 5,
      cessRate: 0,
      supplierStateCode: '37',
      placeOfSupplyStateCode: '37',
    });

    // 142000 / 1.05 = 135238.10
    expect(result.taxableValue).toBeCloseTo(135238.10, 1);
    expect(result.cgstAmount + result.sgstAmount + result.taxableValue).toBe(142000);
    expect(result.totalAmount).toBe(142000);
  });

  it('correctly computes round-off and grand totals', () => {
    const line1 = calculateTaxLine({
      rate: 79900.50,
      quantity: 1,
      discount: 0,
      pricingMode: 'EXCLUSIVE',
      taxTreatment: 'TAXABLE',
      gstRate: 28,
      cessRate: 0,
      supplierStateCode: '37',
      placeOfSupplyStateCode: '37',
    });

    const totals = calculateInvoiceTotals([line1]);
    expect(totals.grandTotal).toBe(Math.round(totals.taxableValue + totals.cgstAmount + totals.sgstAmount));
    expect(totals.roundOff).toBeCloseTo(totals.grandTotal - (totals.taxableValue + totals.cgstAmount + totals.sgstAmount), 2);
  });
});

describe('Indian Currency Words Converter', () => {
  it('converts amounts to standard Indian numbering words', () => {
    expect(numberToWordsIndian(125000)).toBe('Rupees One Lakh Twenty Five Thousand Only');
    expect(numberToWordsIndian(79900)).toBe('Rupees Seventy Nine Thousand Nine Hundred Only');
    expect(numberToWordsIndian(10000000)).toBe('Rupees One Crore Only');
    expect(numberToWordsIndian(0)).toBe('Rupees Zero Only');
  });

  it('converts paise amounts accurately', () => {
    expect(numberToWordsIndian(125.50)).toBe('Rupees One Hundred Twenty Five and Fifty Paise Only');
  });
});

describe('Invoice Numbering & Indian Financial Year', () => {
  it('calculates Indian Financial Year correctly across April boundary', () => {
    const sep2026 = new Date('2026-09-16');
    expect(getIndianFinancialYear(sep2026)).toBe('26-27');

    const feb2027 = new Date('2027-02-15');
    expect(getIndianFinancialYear(feb2027)).toBe('26-27');

    const apr2027 = new Date('2027-04-01');
    expect(getIndianFinancialYear(apr2027)).toBe('27-28');
  });

  it('formats consecutive invoice numbers as SRA/26-27/0001', () => {
    expect(formatInvoiceNumber('SRA', '26-27', 1)).toBe('SRA/26-27/0001');
    expect(formatInvoiceNumber('SRA', '26-27', 42)).toBe('SRA/26-27/0042');
  });
});

describe('Statutory GST Validators', () => {
  it('validates 15-character GSTIN format and state code consistency', () => {
    // Valid Andhra Pradesh GSTIN
    const valid = validateGSTIN('37AAAFS1234F1Z8', '37');
    expect(valid.isValid).toBe(true);

    // Mismatched state code (GSTIN prefix 37 vs selected state 36)
    const mismatch = validateGSTIN('37AAAFS1234F1Z8', '36');
    expect(mismatch.isValid).toBe(false);

    // Invalid format
    const invalid = validateGSTIN('INVALID123');
    expect(invalid.isValid).toBe(false);
  });

  it('validates 10-digit Indian Mobile Numbers', () => {
    expect(validateMobile('8367444144').isValid).toBe(true);
    expect(validateMobile('9876543210').isValid).toBe(true);
    expect(validateMobile('8888888888').isValid).toBe(true);
    expect(validateMobile('1234567890').isValid).toBe(false); // Does not start with 6-9
    expect(validateMobile('98765').isValid).toBe(false); // Too short
  });

  it('validates 6-digit Indian PIN codes', () => {
    expect(validatePincode('521230').isValid).toBe(true);
    expect(validatePincode('520001').isValid).toBe(true);
    expect(validatePincode('000000').isValid).toBe(false);
    expect(validatePincode('52123').isValid).toBe(false);
  });
});
