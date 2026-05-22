import { Request, Response } from 'express';
import { query } from '../db/pool.js';
import { generateMatchReason } from '../utils/reasons.js';

export interface UserProfile {
  age: number;
  monthly_income: number;
  credit_score: number;
  employment_type: string;
  existing_loans: number;
  preferred_product_type?: string;
}

/**
 * Deterministic scoring function for eligible financial products.
 * Combines risk indicators, demographics alignment, and rate suitability.
 */
export const scoreProduct = (product: any, profile: UserProfile): number => {
  let score = 100; // Base score for passing hard eligibility filters

  // 1. Credit Score margin bonus
  const creditMargin = profile.credit_score - product.min_credit_score;
  score += Math.min(30, Math.floor(creditMargin * 0.25));

  // High score excellence bonus (e.g. premium rates for premium tiers)
  if (profile.credit_score >= 800) {
    score += 30;
  } else if (profile.credit_score >= 750) {
    score += 20;
  }

  // 2. Income margin bonus (factors of excess income)
  const minIncome = Number(product.min_income);
  if (minIncome > 0) {
    const incomeRatio = profile.monthly_income / minIncome;
    score += Math.min(30, Math.floor((incomeRatio - 1) * 5));
  } else {
    // High absolute savings potential for products with zero-income baseline
    if (profile.monthly_income >= 50000) {
      score += 15;
    } else if (profile.monthly_income >= 20000) {
      score += 10;
    }
  }

  // 3. Debt burden penalty (negative signal for further credit, minor penalty on savings)
  if (product.type === 'loan' || product.type === 'credit_card') {
    const debtPenalty = profile.existing_loans * 15;
    score -= Math.min(45, debtPenalty);
  } else {
    const debtPenalty = profile.existing_loans * 5;
    score -= Math.min(15, debtPenalty);
  }

  // 4. Rate-based utility bonus/penalty
  const interestRate = Number(product.interest_rate);
  if (product.type === 'savings' || product.type === 'fixed_deposit') {
    // Higher yield = better
    score += Math.floor(interestRate * 3);
  } else if (product.type === 'loan' || product.type === 'credit_card') {
    // Lower borrowing rates = better (standardizing around 10% benchmark)
    const rateMargin = interestRate - 10;
    score -= Math.floor(rateMargin * 1.5);
  }

  // 5. Demographics / Age Proximity Bonus
  const midAge = (product.min_age + product.max_age) / 2;
  const ageCloseness = Math.abs(profile.age - midAge);
  const ageValue = Math.max(0, 10 - Math.floor(ageCloseness / 3));
  score += ageValue;

  return score;
};

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const profile: UserProfile = req.body;
    
    // Fetch all products from our database
    const { rows: allProducts } = await query('SELECT * FROM products');

    // Step 1: Hard filter out products where eligibility rules fail
    const eligibleProducts = allProducts.filter(p => {
      // Age constraint check
      if (profile.age < p.min_age || profile.age > p.max_age) return false;

      // Credit score constraint check
      if (profile.credit_score < p.min_credit_score) return false;

      // Monthly income check
      if (profile.monthly_income < Number(p.min_income)) return false;

      // Employment type check
      // Support postgres array representation or native string array
      const employments = Array.isArray(p.allowed_employment_types)
        ? p.allowed_employment_types
        : [];
      if (!employments.includes(profile.employment_type)) return false;

      // Preferred product type hard filter (if specified by client)
      if (profile.preferred_product_type && p.type !== profile.preferred_product_type) return false;

      return true;
    });

    if (eligibleProducts.length === 0) {
      const responsePayload = {
        recommendations: [],
        message: 'No financial products matched your eligibility criteria. Consider improving your credit rating or adjusting filters.'
      };

      // Log the unsuccessful attempt to database
      await query(
        'INSERT INTO recommendations_log (profile, results) VALUES ($1, $2) RETURNING *',
        [profile, responsePayload.recommendations]
      );

      res.json(responsePayload);
      return;
    }

    // Step 2: Score eligible matches
    const scoredList = eligibleProducts.map(p => {
      const score = scoreProduct(p, profile);
      const reason = generateMatchReason(p, profile, score);
      return {
        product_id: p.id,
        name: p.name,
        type: p.type,
        score,
        reason
      };
    });

    // Step 3: Rank by quality match score (descending), secondary stable sort on ID to guarantee perfect determinism
    scoredList.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.product_id - b.product_id;
    });

    // Take top 3 recommendations
    const rankedRecommendations = scoredList.slice(0, 3);
    
    let note = undefined;
    if (rankedRecommendations.length < 3) {
      note = `Only ${rankedRecommendations.length} product${rankedRecommendations.length > 1 ? 's' : ''} matched your profile parameters out of our full catalog.`;
    }

    const payload = {
      recommendations: rankedRecommendations,
      ...(note && { note })
    };

    // Log the successful recommendation results
    await query(
      'INSERT INTO recommendations_log (profile, results) VALUES ($1, $2) RETURNING *',
      [profile, rankedRecommendations]
    );

    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: `Internal server failure in recommendation processing: ${err.message}` });
  }
};
