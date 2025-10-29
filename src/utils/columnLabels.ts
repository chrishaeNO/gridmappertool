/**
 * Generates column labels in Excel-style format: A-Z, AA-AZ, BA-BZ, etc.
 * @param index - Zero-based column index
 * @returns Column label string (A, B, C, ..., Z, AA, AB, ..., AZ, BA, etc.)
 */
export function getColumnLabel(index: number): string {
  if (index < 0) return '';
  
  let result = '';
  let num = index;
  
  do {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  } while (num >= 0);
  
  return result;
}
