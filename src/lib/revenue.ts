/**
 * Collected revenue is a subset of signed-sale revenue.
 *
 * HCP history can contain payments that were imported before a matching
 * LeadFlow sale existed. Those payments remain in the ledger for audit and
 * reconciliation, but they must not inflate user-facing collected totals
 * beyond the signed-sale denominator.
 */
export function collectedWithinSold(collected: number, sold: number): number {
  const safeCollected = Number.isFinite(collected) ? Math.max(0, collected) : 0;
  const safeSold = Number.isFinite(sold) ? Math.max(0, sold) : 0;
  return Math.min(safeCollected, safeSold);
}