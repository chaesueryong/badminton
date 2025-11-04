/**
 * Format phone number to 010-XXXX-XXXX format
 * @param phone - Phone number string (can be with or without hyphens)
 * @returns Formatted phone number or original if invalid
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if it's a valid Korean mobile number
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    // Format as 010-XXXX-XXXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10 && cleaned.startsWith('01')) {
    // Format as 010-XXX-XXXX (older format)
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Return original if not a valid format
  return phone;
}

/**
 * Remove formatting from phone number (keep only digits)
 * @param phone - Formatted phone number
 * @returns Phone number with only digits
 */
export function unformatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, '');
}