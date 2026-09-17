import { getStateByCode } from './indianStates';

/**
 * Standard Indian GSTIN Regex:
 * 2 digits State Code + 5 chars PAN chars 1-5 + 4 digits PAN chars 6-9 + 1 char PAN char 10 + 1 entity code + 'Z' + 1 check digit
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function validateGSTIN(gstin: string, expectedStateCode?: string): { isValid: boolean; error?: string } {
  const clean = gstin.trim().toUpperCase();
  if (!clean) {
    return { isValid: false, error: 'GSTIN cannot be empty' };
  }
  if (!GSTIN_REGEX.test(clean)) {
    return { isValid: false, error: 'Invalid GSTIN format (must be 15 alphanumeric characters, e.g. 36AAAFS1234F1Z8)' };
  }

  const stateCodeFromGstin = clean.substring(0, 2);
  const state = getStateByCode(stateCodeFromGstin);
  if (!state) {
    return { isValid: false, error: `Invalid State Code prefix "${stateCodeFromGstin}" in GSTIN` };
  }

  if (expectedStateCode && expectedStateCode.trim() !== stateCodeFromGstin) {
    return { 
      isValid: false, 
      error: `GSTIN state code "${stateCodeFromGstin}" does not match selected state code "${expectedStateCode.trim()}"` 
    };
  }

  return { isValid: true };
}

export function validateMobile(mobile: string): { isValid: boolean; error?: string } {
  const clean = mobile.replace(/[^0-9]/g, '');
  if (clean.length === 10 && MOBILE_REGEX.test(clean)) {
    return { isValid: true };
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    const sub = clean.substring(2);
    if (MOBILE_REGEX.test(sub)) return { isValid: true };
  }
  return { isValid: false, error: 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9' };
}

export function validatePincode(pincode: string): { isValid: boolean; error?: string } {
  const clean = pincode.trim();
  if (!PINCODE_REGEX.test(clean)) {
    return { isValid: false, error: 'Enter a valid 6-digit Indian PIN code' };
  }
  return { isValid: true };
}

export function validatePAN(pan: string): { isValid: boolean; error?: string } {
  const clean = pan.trim().toUpperCase();
  if (!PAN_REGEX.test(clean)) {
    return { isValid: false, error: 'Enter a valid 10-digit PAN (e.g. AAAFS1234F)' };
  }
  return { isValid: true };
}

export function validatePositiveNumber(val: number, fieldName: string): { isValid: boolean; error?: string } {
  if (isNaN(val) || val <= 0) {
    return { isValid: false, error: `${fieldName} must be a positive number greater than 0` };
  }
  return { isValid: true };
}
