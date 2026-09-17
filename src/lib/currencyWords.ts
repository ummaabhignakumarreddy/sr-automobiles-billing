const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(num: number): string {
  let result = '';

  if (num >= 100) {
    result += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }

  if (num >= 20) {
    result += TENS[Math.floor(num / 10)] + ' ';
    num %= 10;
  }

  if (num > 0) {
    result += ONES[num] + ' ';
  }

  return result.trim();
}

/**
 * Converts a positive number to Indian Currency Words
 * Example: 125000 -> "Rupees One Lakh Twenty Five Thousand Only"
 */
export function numberToWordsIndian(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'Rupees Zero Only';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const rupeesPart = Math.floor(absAmount);
  const paisePart = Math.round((absAmount - rupeesPart) * 100);

  let remaining = rupeesPart;
  let words = '';

  // Crores: 1,00,00,000
  const crores = Math.floor(remaining / 10000000);
  if (crores > 0) {
    words += convertLessThanThousand(crores) + ' Crore ';
    remaining %= 10000000;
  }

  // Lakhs: 1,00,000
  const lakhs = Math.floor(remaining / 100000);
  if (lakhs > 0) {
    words += convertLessThanThousand(lakhs) + ' Lakh ';
    remaining %= 100000;
  }

  // Thousands: 1,000
  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    words += convertLessThanThousand(thousands) + ' Thousand ';
    remaining %= 1000;
  }

  // Hundreds & below
  if (remaining > 0) {
    words += convertLessThanThousand(remaining) + ' ';
  }

  words = words.trim();
  let finalString = isNegative ? 'Minus ' : '';

  if (rupeesPart > 0) {
    finalString += `Rupees ${words}`;
  } else {
    finalString += 'Rupees Zero';
  }

  if (paisePart > 0) {
    const paiseWords = convertLessThanThousand(paisePart);
    finalString += ` and ${paiseWords} Paise`;
  }

  finalString += ' Only';

  return finalString.replace(/\s+/g, ' ').trim();
}
