/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Budget Calculation Module for Utsav Event Planner
 *
 * This module handles all budget calculation and allocation logic:
 * 1. Categorization: Ensures the standard 6 event categories (Venue, Food, Decor,
 *    Entertainment, Photography, Miscellaneous) are present and properly matched.
 * 2. Share Normalization: Ensures percentage shares are whole numbers and sum
 *    to exactly 100%. If Gemini or user input returns shares that do not equal 100%,
 *    the difference is balanced on the category with the largest share.
 * 3. Rupee Amount Calculation: Calculates rupee amounts in integer precision:
 *    amount = round(totalBudget * share / 100).
 * 4. Remainder Allocation: If rounding causes the sum of amounts to differ from
 *    the total budget (by even 1 rupee on awkward budgets), the difference is
 *    added or subtracted on the largest category so the final ledger sum
 *    matches the total budget exactly.
 */

export interface RawBudgetShare {
  category?: string;
  share?: number;
}

export interface BudgetItem {
  category: string;
  share: number;
  amount: number;
}

/**
 * The standard categories defined for all Utsav celebration plans.
 */
export const TARGET_BUDGET_CATEGORIES: readonly string[] = [
  'Venue',
  'Food',
  'Decor',
  'Entertainment',
  'Photography',
  'Miscellaneous',
] as const;

/**
 * Sensible default percentage breakdown for Indian events if categories are omitted.
 * Sums to exactly 100%.
 */
export const DEFAULT_BUDGET_SHARES: Record<string, number> = {
  venue: 25,
  food: 35,
  decor: 15,
  entertainment: 10,
  photography: 10,
  miscellaneous: 5,
};

/**
 * Resolves an incoming category name against standard target categories using
 * case-insensitive matching and common synonyms (e.g., 'catering' -> 'Food').
 *
 * @param cat - The target category name to find a share for.
 * @param shareMap - Map of normalized incoming category names to their shares.
 * @returns The percentage share (integer).
 */
function resolveShareForCategory(cat: string, shareMap: Map<string, number>): number {
  const c = cat.toLowerCase();

  for (const [key, val] of shareMap.entries()) {
    // Exact match
    if (key === c) return val;

    // Keyword synonyms
    if (c === 'venue' && (key.includes('venue') || key.includes('hall') || key.includes('location'))) return val;
    if (c === 'food' && (key.includes('food') || key.includes('cater') || key.includes('meal') || key.includes('dining'))) return val;
    if (c === 'decor' && (key.includes('decor') || key.includes('flower') || key.includes('floral'))) return val;
    if (
      c === 'entertainment' &&
      (key.includes('entertain') || key.includes('music') || key.includes('sound') || key.includes('dj') || key.includes('audio'))
    ) {
      return val;
    }
    if (c === 'photography' && (key.includes('photo') || key.includes('video') || key.includes('camera'))) return val;
    if (c === 'miscellaneous' && (key.includes('misc') || key.includes('other') || key.includes('contingenc') || key.includes('buffer'))) {
      return val;
    }
  }

  // Fallback to sensible defaults
  return DEFAULT_BUDGET_SHARES[c] ?? 5;
}

/**
 * Normalizes an array of percentage shares so that they are integers and sum to exactly 100.
 * If the sum does not equal 100, the difference is allocated to the category with the largest share.
 *
 * @param items - Budget items with category and share properties.
 * @returns The items array with adjusted shares summing to 100.
 */
export function normalizeSharesTo100<T extends { category: string; share: number }>(items: T[]): T[] {
  if (items.length === 0) return items;

  // Ensure all shares are non-negative rounded integers
  for (const item of items) {
    item.share = Math.max(0, Math.round(Number(item.share) || 0));
  }

  const shareSum = items.reduce((sum, item) => sum + item.share, 0);
  const shareDiff = 100 - shareSum;

  if (shareDiff !== 0) {
    // Find index of category with the largest share
    let largestShareIndex = 0;
    for (let i = 1; i < items.length; i++) {
      if (items[i].share > items[largestShareIndex].share) {
        largestShareIndex = i;
      }
    }

    // Apply remainder to the largest share
    items[largestShareIndex].share += shareDiff;

    // Safety guard: Ensure largest share did not become negative
    if (items[largestShareIndex].share < 0) {
      items[largestShareIndex].share = 0;
    }
  }

  return items;
}

/**
 * Calculates the complete rupee budget ledger for an event.
 *
 * Rules:
 * 1. Category extraction: Matches against standard 6 categories or falls back to defaults.
 * 2. Normalization: If incoming shares do not add up to 100, adjusts the largest share so they do.
 * 3. Amount calculation: amount = round(totalBudget * share / 100).
 * 4. Exact budget balancing: If the sum of rounded amounts does not equal totalBudget,
 *    adds or subtracts the difference on the category with the largest amount.
 *
 * @param rawShares - Array of raw share objects returned by Gemini or preset configuration.
 * @param totalBudget - Total budget in INR (positive integer).
 * @returns Array of BudgetItem objects containing category, normalized share, and exact rupee amount.
 */
export function calculateRupeeBudgetLedger(
  rawShares: RawBudgetShare[] | null | undefined,
  totalBudget: number
): BudgetItem[] {
  // Guard against invalid or negative budget input
  const safeBudget = Math.max(0, Math.round(Number(totalBudget) || 0));

  // Build lookup map from incoming raw shares
  const shareMap = new Map<string, number>();
  for (const item of rawShares || []) {
    if (item && typeof item.category === 'string') {
      const key = item.category.trim().toLowerCase();
      shareMap.set(key, Math.round(Number(item.share) || 0));
    }
  }

  // Populate items for all 6 target categories
  const items: BudgetItem[] = TARGET_BUDGET_CATEGORIES.map((cat) => ({
    category: cat,
    share: Math.max(0, Math.round(resolveShareForCategory(cat, shareMap))),
    amount: 0,
  }));

  // Step 1: Ensure percentage shares add up to exactly 100%
  normalizeSharesTo100(items);

  // Step 2: Calculate rupee amount for each category:
  // amount = total budget x share / 100, rounded to the nearest rupee
  for (const item of items) {
    item.amount = Math.round((safeBudget * item.share) / 100);
  }

  // Step 3: Reconcile rounding differences so total equals totalBudget exactly
  const amountSum = items.reduce((sum, item) => sum + item.amount, 0);
  const amountDiff = safeBudget - amountSum;

  if (amountDiff !== 0 && items.length > 0) {
    // Find the category with the largest amount to absorb the difference
    let largestCategoryIndex = 0;
    for (let i = 1; i < items.length; i++) {
      if (items[i].amount > items[largestCategoryIndex].amount) {
        largestCategoryIndex = i;
      }
    }
    items[largestCategoryIndex].amount += amountDiff;
  }

  return items;
}
