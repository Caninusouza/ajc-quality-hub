/**
 * Parses all claim IDs in the format FSQA-YYYY-NNN and returns the next one.
 * Falls back to FSQA-{currentYear}-001 if no existing IDs found.
 */
export function generateNextClaimId(existingClaims) {
  const year = new Date().getFullYear();
  const pattern = /^FSQA-(\d{4})-(\d+)$/i;

  let maxNum = 0;
  for (const claim of existingClaims) {
    const match = (claim.claim_id || '').trim().match(pattern);
    if (match) {
      const num = parseInt(match[2], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  const next = String(maxNum + 1).padStart(3, '0');
  return `FSQA-${year}-${next}`;
}