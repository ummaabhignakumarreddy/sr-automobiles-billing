/**
 * Determines Indian Financial Year string from a given date.
 * Financial Year runs from April 1 to March 31.
 * e.g., Date in Sep 2026 -> returns '26-27'
 * e.g., Date in Feb 2027 -> returns '26-27'
 * e.g., Date in Apr 2027 -> returns '27-28'
 */
export function getIndianFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Jan, 3 = Apr, 11 = Dec

  let startYear: number;
  let endYear: number;

  if (month >= 3) {
    // April (3) to December (11)
    startYear = year;
    endYear = year + 1;
  } else {
    // January (0) to March (2)
    startYear = year - 1;
    endYear = year;
  }

  const startStr = String(startYear).slice(-2);
  const endStr = String(endYear).slice(-2);

  return `${startStr}-${endStr}`;
}

/**
 * Formats a sequence number into the standard dealership format:
 * SRA/26-27/0001
 */
export function formatInvoiceNumber(
  prefix: string = 'SRA',
  financialYear: string,
  sequenceNumber: number
): string {
  const cleanPrefix = (prefix || 'SRA').trim().toUpperCase();
  const paddedSeq = String(sequenceNumber).padStart(4, '0');
  return `${cleanPrefix}/${financialYear}/${paddedSeq}`;
}

/**
 * Parse an invoice number to extract prefix, FY, and sequence number
 */
export function parseInvoiceNumber(invNo: string): { prefix: string; fy: string; sequence: number } | null {
  const match = invNo.trim().match(/^([A-Z0-9]+)\/(\d{2}-\d{2})\/(\d+)$/i);
  if (!match) return null;
  return {
    prefix: match[1],
    fy: match[2],
    sequence: parseInt(match[3], 10),
  };
}
