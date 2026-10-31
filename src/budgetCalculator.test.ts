/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRupeeBudgetLedger,
  normalizeSharesTo100,
  TARGET_BUDGET_CATEGORIES,
  DEFAULT_BUDGET_SHARES,
  BudgetItem,
} from './budgetCalculator.ts';

describe('Budget Calculator - normalizeSharesTo100', () => {
  it('preserves shares that already sum to 100', () => {
    const items = [
      { category: 'Venue', share: 25 },
      { category: 'Food', share: 35 },
      { category: 'Decor', share: 15 },
      { category: 'Entertainment', share: 10 },
      { category: 'Photography', share: 10 },
      { category: 'Miscellaneous', share: 5 },
    ];

    const result = normalizeSharesTo100(items);
    const sum = result.reduce((acc, it) => acc + it.share, 0);

    assert.equal(sum, 100);
    assert.equal(result.find((i) => i.category === 'Food')?.share, 35);
    assert.equal(result.find((i) => i.category === 'Venue')?.share, 25);
  });

  it('adjusts the largest category down when shares exceed 100', () => {
    // Sum is 115 (15 over 100). Largest is Food (40).
    const items = [
      { category: 'Venue', share: 25 },
      { category: 'Food', share: 40 },
      { category: 'Decor', share: 20 },
      { category: 'Entertainment', share: 10 },
      { category: 'Photography', share: 10 },
      { category: 'Miscellaneous', share: 10 },
    ];

    const result = normalizeSharesTo100(items);
    const sum = result.reduce((acc, it) => acc + it.share, 0);

    assert.equal(sum, 100);
    // Food was 40, reduced by 15 to 25
    assert.equal(result.find((i) => i.category === 'Food')?.share, 25);
    // Other shares remain untouched
    assert.equal(result.find((i) => i.category === 'Decor')?.share, 20);
  });

  it('adjusts the largest category up when shares are less than 100', () => {
    // Sum is 85 (15 under 100). Largest is Food (30).
    const items = [
      { category: 'Venue', share: 20 },
      { category: 'Food', share: 30 },
      { category: 'Decor', share: 15 },
      { category: 'Entertainment', share: 10 },
      { category: 'Photography', share: 5 },
      { category: 'Miscellaneous', share: 5 },
    ];

    const result = normalizeSharesTo100(items);
    const sum = result.reduce((acc, it) => acc + it.share, 0);

    assert.equal(sum, 100);
    // Food was 30, increased by 15 to 45
    assert.equal(result.find((i) => i.category === 'Food')?.share, 45);
    assert.equal(result.find((i) => i.category === 'Venue')?.share, 20);
  });
});

describe('Budget Calculator - calculateRupeeBudgetLedger', () => {
  // Test suite 1: Shares that add up to 100
  describe('1. Shares that add up to 100', () => {
    it('calculates exact category amounts for a standard 50,000 INR budget', () => {
      const shares = [
        { category: 'Venue', share: 25 },
        { category: 'Food', share: 35 },
        { category: 'Decor', share: 15 },
        { category: 'Entertainment', share: 10 },
        { category: 'Photography', share: 10 },
        { category: 'Miscellaneous', share: 5 },
      ];
      const totalBudget = 50000;

      const ledger = calculateRupeeBudgetLedger(shares, totalBudget);

      // Verify all 6 categories exist
      assert.equal(ledger.length, 6);
      for (const cat of TARGET_BUDGET_CATEGORIES) {
        assert.ok(ledger.some((item) => item.category === cat));
      }

      // Verify share sum is exactly 100
      const totalShare = ledger.reduce((sum, item) => sum + item.share, 0);
      assert.equal(totalShare, 100);

      // Verify individual amounts
      const venue = ledger.find((i) => i.category === 'Venue');
      const food = ledger.find((i) => i.category === 'Food');
      const decor = ledger.find((i) => i.category === 'Decor');
      const entertainment = ledger.find((i) => i.category === 'Entertainment');
      const photo = ledger.find((i) => i.category === 'Photography');
      const misc = ledger.find((i) => i.category === 'Miscellaneous');

      assert.equal(venue?.amount, 12500); // 25% of 50000
      assert.equal(food?.amount, 17500);  // 35% of 50000
      assert.equal(decor?.amount, 7500);  // 15% of 50000
      assert.equal(entertainment?.amount, 5000); // 10% of 50000
      assert.equal(photo?.amount, 5000);  // 10% of 50000
      assert.equal(misc?.amount, 2500);   // 5% of 50000

      // Verify total rupee amount strictly equals budget
      const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
      assert.equal(totalAmount, totalBudget);
    });

    it('works with custom category name synonyms (e.g. Catering, Floral, Music)', () => {
      const sharesWithSynonyms = [
        { category: 'Wedding Hall Location', share: 30 },
        { category: 'Catering and Dining', share: 40 },
        { category: 'Floral & Stage Decor', share: 10 },
        { category: 'DJ & Sound System', share: 10 },
        { category: 'Camera & Video', share: 5 },
        { category: 'Contingency Fund', share: 5 },
      ];
      const totalBudget = 200000;

      const ledger = calculateRupeeBudgetLedger(sharesWithSynonyms, totalBudget);
      const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);

      assert.equal(totalAmount, totalBudget);
      assert.equal(ledger.find((i) => i.category === 'Venue')?.share, 30);
      assert.equal(ledger.find((i) => i.category === 'Food')?.share, 40);
    });
  });

  // Test suite 2: Shares that do not add up to 100
  describe('2. Shares that do not add up to 100', () => {
    it('adjusts largest share when Gemini returns shares totaling 107%', () => {
      // 30 + 40 + 15 + 10 + 7 + 5 = 107%
      const overShares = [
        { category: 'Venue', share: 30 },
        { category: 'Food', share: 40 },
        { category: 'Decor', share: 15 },
        { category: 'Entertainment', share: 10 },
        { category: 'Photography', share: 7 },
        { category: 'Miscellaneous', share: 5 },
      ];
      const totalBudget = 100000;

      const ledger = calculateRupeeBudgetLedger(overShares, totalBudget);

      // Verify shares now sum to exactly 100
      const totalShare = ledger.reduce((sum, item) => sum + item.share, 0);
      assert.equal(totalShare, 100);

      // Largest category was Food (40%), reduced by 7% to 33%
      const food = ledger.find((i) => i.category === 'Food');
      assert.equal(food?.share, 33);

      // Other categories remain intact
      assert.equal(ledger.find((i) => i.category === 'Venue')?.share, 30);
      assert.equal(ledger.find((i) => i.category === 'Decor')?.share, 15);

      // Final total amount strictly equals budget
      const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
      assert.equal(totalAmount, totalBudget);
    });

    it('adjusts largest share when Gemini returns shares totaling only 90%', () => {
      // 20 + 35 + 15 + 10 + 5 + 5 = 90%
      const underShares = [
        { category: 'Venue', share: 20 },
        { category: 'Food', share: 35 },
        { category: 'Decor', share: 15 },
        { category: 'Entertainment', share: 10 },
        { category: 'Photography', share: 5 },
        { category: 'Miscellaneous', share: 5 },
      ];
      const totalBudget = 80000;

      const ledger = calculateRupeeBudgetLedger(underShares, totalBudget);

      const totalShare = ledger.reduce((sum, item) => sum + item.share, 0);
      assert.equal(totalShare, 100);

      // Largest category was Food (35%), increased by 10% to 45%
      const food = ledger.find((i) => i.category === 'Food');
      assert.equal(food?.share, 45);

      const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
      assert.equal(totalAmount, totalBudget);
    });

    it('falls back to default 100% distribution when input is empty or null', () => {
      const ledgerFromNull = calculateRupeeBudgetLedger(null, 50000);
      const ledgerFromEmpty = calculateRupeeBudgetLedger([], 50000);

      const sumNull = ledgerFromNull.reduce((sum, item) => sum + item.share, 0);
      const sumEmpty = ledgerFromEmpty.reduce((sum, item) => sum + item.share, 0);

      assert.equal(sumNull, 100);
      assert.equal(sumEmpty, 100);
      assert.equal(ledgerFromNull.reduce((sum, item) => sum + item.amount, 0), 50000);
    });
  });

  // Test suite 3: Awkward budgets like 735,000 INR
  describe('3. Awkward budgets like 735,000 INR', () => {
    it('calculates clean ledger for 735,000 INR with standard shares', () => {
      const totalBudget = 735000;
      const shares = [
        { category: 'Venue', share: 25 },
        { category: 'Food', share: 35 },
        { category: 'Decor', share: 15 },
        { category: 'Entertainment', share: 10 },
        { category: 'Photography', share: 10 },
        { category: 'Miscellaneous', share: 5 },
      ];

      const ledger = calculateRupeeBudgetLedger(shares, totalBudget);

      const venue = ledger.find((i) => i.category === 'Venue');
      const food = ledger.find((i) => i.category === 'Food');
      const decor = ledger.find((i) => i.category === 'Decor');
      const entertainment = ledger.find((i) => i.category === 'Entertainment');
      const photo = ledger.find((i) => i.category === 'Photography');
      const misc = ledger.find((i) => i.category === 'Miscellaneous');

      // 735000 * 0.25 = 183750
      assert.equal(venue?.amount, 183750);
      // 735000 * 0.35 = 257250
      assert.equal(food?.amount, 257250);
      // 735000 * 0.15 = 110250
      assert.equal(decor?.amount, 110250);
      // 735000 * 0.10 = 73500
      assert.equal(entertainment?.amount, 73500);
      // 735000 * 0.10 = 73500
      assert.equal(photo?.amount, 73500);
      // 735000 * 0.05 = 36750
      assert.equal(misc?.amount, 36750);

      // Verify strict sum
      const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
      assert.equal(totalAmount, 735000);
    });

    it('handles 735,000 INR with prime/uneven percentage shares', () => {
      const totalBudget = 735000;
      // 31 + 29 + 17 + 11 + 7 + 5 = 100%
      const unevenShares = [
        { category: 'Venue', share: 31 },
        { category: 'Food', share: 29 },
        { category: 'Decor', share: 17 },
        { category: 'Entertainment', share: 11 },
        { category: 'Photography', share: 7 },
        { category: 'Miscellaneous', share: 5 },
      ];

      const ledger = calculateRupeeBudgetLedger(unevenShares, totalBudget);

      // Check all amounts are integers
      for (const item of ledger) {
        assert.ok(Number.isInteger(item.amount), `${item.category} amount is not integer: ${item.amount}`);
      }

      // Check total equals exactly 735,000
      const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
      assert.equal(totalAmount, 735000);
    });
  });

  // Test suite 4: Rounding differences and remainder balancing
  describe('4. Rounding differences', () => {
    it('balances rounding differences on an awkward odd budget of 735,001 INR', () => {
      const totalBudget = 735001;
      const shares = [
        { category: 'Venue', share: 33 },
        { category: 'Food', share: 22 },
        { category: 'Decor', share: 18 },
        { category: 'Entertainment', share: 12 },
        { category: 'Photography', share: 10 },
        { category: 'Miscellaneous', share: 5 },
      ];

      const ledger = calculateRupeeBudgetLedger(shares, totalBudget);

      // Unrounded calculations:
      // Venue: 735001 * 0.33 = 242550.33 -> round 242550
      // Food: 735001 * 0.22 = 161700.22 -> round 161700
      // Decor: 735001 * 0.18 = 132300.18 -> round 132300
      // Entertainment: 735001 * 0.12 = 88200.12 -> round 88200
      // Photography: 735001 * 0.10 = 73500.10 -> round 73500
      // Miscellaneous: 735001 * 0.05 = 36750.05 -> round 36750
      // Sum of rounded: 735000 (1 rupee short of 735001).
      // The largest category (Venue, amount 242550) should absorb +1 rupee -> 242551.

      const venue = ledger.find((i) => i.category === 'Venue');
      assert.equal(venue?.amount, 242551);

      // Total must equal exactly 735,001 INR
      const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
      assert.equal(totalAmount, 735001);
    });

    it('balances multiple fractional rupee rounding differences on 99,999 INR', () => {
      const totalBudget = 99999;
      // 17 * 5 + 15 = 100%
      const shares = [
        { category: 'Venue', share: 17 },
        { category: 'Food', share: 17 },
        { category: 'Decor', share: 17 },
        { category: 'Entertainment', share: 17 },
        { category: 'Photography', share: 17 },
        { category: 'Miscellaneous', share: 15 },
      ];

      const ledger = calculateRupeeBudgetLedger(shares, totalBudget);

      // Every item amount must be a whole rupee
      for (const item of ledger) {
        assert.ok(Number.isInteger(item.amount));
        assert.ok(item.amount > 0);
      }

      // Sum must equal 99,999 exactly
      const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
      assert.equal(totalAmount, 99999);
    });

    it('handles small awkward budgets like 1,003 INR without drift', () => {
      const totalBudget = 1003;
      const ledger = calculateRupeeBudgetLedger(
        [
          { category: 'Venue', share: 25 },
          { category: 'Food', share: 35 },
          { category: 'Decor', share: 15 },
          { category: 'Entertainment', share: 10 },
          { category: 'Photography', share: 10 },
          { category: 'Miscellaneous', share: 5 },
        ],
        totalBudget
      );

      const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
      assert.equal(totalAmount, 1003);
    });

    it('handles zero budget gracefully', () => {
      const ledger = calculateRupeeBudgetLedger(null, 0);
      const totalAmount = ledger.reduce((sum, item) => sum + item.amount, 0);
      assert.equal(totalAmount, 0);
      for (const item of ledger) {
        assert.equal(item.amount, 0);
      }
    });
  });
});
