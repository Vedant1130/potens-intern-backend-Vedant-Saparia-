-- Migration 001 - Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('loan', 'credit_card', 'savings', 'insurance', 'fixed_deposit')),
  min_age INT NOT NULL,
  max_age INT NOT NULL,
  min_income NUMERIC(15, 2) NOT NULL,
  min_credit_score INT NOT NULL,
  allowed_employment_types TEXT[] NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,
  description TEXT NOT NULL,
  eligibility_summary TEXT NOT NULL
);
