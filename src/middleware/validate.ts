import { Request, Response, NextFunction } from 'express';

export const validateProfile = (req: Request, res: Response, next: NextFunction): void => {
  const { age, monthly_income, credit_score, employment_type, existing_loans, preferred_product_type } = req.body;

  // 1. age
  if (age === undefined || age === null) {
    res.status(400).json({ error: 'Required field age is missing.' });
    return;
  }
  const parsedAge = Number(age);
  if (!Number.isInteger(parsedAge) || parsedAge <= 0) {
    res.status(400).json({ error: 'Age must be a positive integer.' });
    return;
  }

  // 2. monthly_income
  if (monthly_income === undefined || monthly_income === null) {
    res.status(400).json({ error: 'Required field monthly_income is missing.' });
    return;
  }
  const parsedIncome = Number(monthly_income);
  if (isNaN(parsedIncome) || parsedIncome < 0) {
    res.status(400).json({ error: 'Monthly income must be a non-negative numeric value.' });
    return;
  }

  // 3. credit_score
  if (credit_score === undefined || credit_score === null) {
    res.status(400).json({ error: 'Required field credit_score is missing.' });
    return;
  }
  const parsedScore = Number(credit_score);
  if (!Number.isInteger(parsedScore) || parsedScore < 300 || parsedScore > 900) {
    res.status(400).json({ error: 'Credit score must be an integer between 300 and 900.' });
    return;
  }

  // 4. employment_type
  if (!employment_type) {
    res.status(400).json({ error: 'Required field employment_type is missing.' });
    return;
  }
  const validEmploymentTypes = ['salaried', 'self_employed', 'freelancer', 'retired', 'student'];
  if (!validEmploymentTypes.includes(employment_type)) {
    res.status(400).json({ error: `Employment type must be one of: ${validEmploymentTypes.join(', ')}` });
    return;
  }

  // 5. existing_loans
  if (existing_loans === undefined || existing_loans === null) {
    res.status(400).json({ error: 'Required field existing_loans is missing.' });
    return;
  }
  const parsedLoans = Number(existing_loans);
  if (!Number.isInteger(parsedLoans) || parsedLoans < 0) {
    res.status(400).json({ error: 'Existing loans count must be a non-negative integer.' });
    return;
  }

  // 6. preferred_product_type (optional)
  if (preferred_product_type !== undefined && preferred_product_type !== null) {
    const validProductTypes = ['loan', 'credit_card', 'savings', 'insurance', 'fixed_deposit'];
    if (!validProductTypes.includes(preferred_product_type)) {
      res.status(400).json({ error: `Preferred product type must be one of: ${validProductTypes.join(', ')}` });
      return;
    }
  }

  // Store parsed credentials on request body to make downstream controllers robust
  req.body.age = parsedAge;
  req.body.monthly_income = parsedIncome;
  req.body.credit_score = parsedScore;
  req.body.existing_loans = parsedLoans;

  next();
};

export const validateProduct = (req: Request, res: Response, next: NextFunction): void => {
  const { name, type, min_age, max_age, min_income, min_credit_score, allowed_employment_types, interest_rate, description, eligibility_summary } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Product name is required.' });
    return;
  }

  const validProductTypes = ['loan', 'credit_card', 'savings', 'insurance', 'fixed_deposit'];
  if (!type || !validProductTypes.includes(type)) {
    res.status(400).json({ error: `Product type is required and must be one of: ${validProductTypes.join(', ')}` });
    return;
  }

  const parsedMinAge = Number(min_age);
  const parsedMaxAge = Number(max_age);
  if (isNaN(parsedMinAge) || isNaN(parsedMaxAge) || parsedMinAge < 0 || parsedMaxAge < parsedMinAge) {
    res.status(400).json({ error: 'Valid min_age and max_age are required, and max_age must not be less than min_age.' });
    return;
  }

  const parsedIncome = Number(min_income);
  if (isNaN(parsedIncome) || parsedIncome < 0) {
    res.status(400).json({ error: 'Min income must be a non-negative numeric value.' });
    return;
  }

  const parsedScore = Number(min_credit_score);
  if (isNaN(parsedScore) || parsedScore < 300 || parsedScore > 900) {
    res.status(400).json({ error: 'Min credit score must be an integer between 300 and 900.' });
    return;
  }

  if (!Array.isArray(allowed_employment_types) || allowed_employment_types.length === 0) {
    res.status(400).json({ error: 'allowed_employment_types must be a non-empty array of valid employment types.' });
    return;
  }

  const validEmploymentTypes = ['salaried', 'self_employed', 'freelancer', 'retired', 'student'];
  for (const emp of allowed_employment_types) {
    if (!validEmploymentTypes.includes(emp)) {
      res.status(400).json({ error: `Invalid employment type "${emp}" in allowed_employment_types.` });
      return;
    }
  }

  const parsedRate = Number(interest_rate);
  if (isNaN(parsedRate) || parsedRate < 0) {
    res.status(400).json({ error: 'Interest rate must be a non-negative numeric percentage.' });
    return;
  }

  if (!description || typeof description !== 'string') {
    res.status(400).json({ error: 'Product description is required.' });
    return;
  }

  if (!eligibility_summary || typeof eligibility_summary !== 'string') {
    res.status(400).json({ error: 'Product eligibility_summary explanation is required.' });
    return;
  }

  next();
};
