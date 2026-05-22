import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const DATA_DIR = path.resolve('data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const products = [
  {
    name: "Premium Slate Personal Loan",
    type: "loan",
    min_age: 21,
    max_age: 58,
    min_income: 50000,
    min_credit_score: 750,
    allowed_employment_types: ['salaried', 'self_employed'],
    interest_rate: 10.50,
    description: "High-limit personal loan with low interest rates for high-income earners with stable employment history.",
    eligibility_summary: "Designed for individuals aged 21 to 58, stable monthly salaried or self-employed income of ₹50,000 or above, and a strong credit score exceeding 750."
  },
  {
    name: "Standard Micro-Personal Loan",
    type: "loan",
    min_age: 18,
    max_age: 65,
    min_income: 15000,
    min_credit_score: 600,
    allowed_employment_types: ['salaried', 'self_employed', 'freelancer'],
    interest_rate: 15.00,
    description: "Quick-approval short-term loan for emergency capital, medical expenses, or standard utility requirements.",
    eligibility_summary: "Open to early-stage professionals aged 18 to 65, with a modest monthly income of ₹15,000+, and a minimum credit score of 600."
  },
  {
    name: "Elite Jetset Credit Card",
    type: "credit_card",
    min_age: 21,
    max_age: 60,
    min_income: 80000,
    min_credit_score: 780,
    allowed_employment_types: ['salaried', 'self_employed'],
    interest_rate: 42.00,
    description: "Premium travel credit card with unlimited international airport lounge access, robust travel insurance, and luxury rewards multipliers.",
    eligibility_summary: "High-tier card requiring age 21 to 60, premium monthly income of ₹80,000+, and a stellar credit history with score of 780+."
  },
  {
    name: "Essential Rewards Credit Card",
    type: "credit_card",
    min_age: 18,
    max_age: 70,
    min_income: 20000,
    min_credit_score: 650,
    allowed_employment_types: ['salaried', 'self_employed', 'freelancer', 'retired'],
    interest_rate: 36.00,
    description: "Daily cashback card offering highest reward percentages on bills, grocery shopping, and local restaurant dine-outs.",
    eligibility_summary: "Mass-market credit card for individuals aged 18 to 70 with an income of ₹20,000+ and a credit score of 650+."
  },
  {
    name: "Student Builder Credit Card",
    type: "credit_card",
    min_age: 18,
    max_age: 25,
    min_income: 0,
    min_credit_score: 300,
    allowed_employment_types: ['student'],
    interest_rate: 30.00,
    description: "Begin your credit history journey. Featuring zero membership fees and customizable alert tools to guard early behaviors.",
    eligibility_summary: "Exclusive to students aged 18 to 25. No income or past credit score required to start building historical credit limits."
  },
  {
    name: "High-Yield SuperSaver Savings Account",
    type: "savings",
    min_age: 18,
    max_age: 99,
    min_income: 30000,
    min_credit_score: 300,
    allowed_employment_types: ['salaried', 'self_employed', 'freelancer', 'retired'],
    interest_rate: 7.20,
    description: "Maximize your interest with a high-yield dynamic savings scheme providing quarterly pay-outs and absolute liquidity.",
    eligibility_summary: "Age 18 and above, minimum monthly incoming funds of ₹30,000. Perfect for professionals wanting high returns with no lock-in periods."
  },
  {
    name: "Basic Citizen Savings Account",
    type: "savings",
    min_age: 10,
    max_age: 99,
    min_income: 0,
    min_credit_score: 300,
    allowed_employment_types: ['salaried', 'self_employed', 'freelancer', 'retired', 'student'],
    interest_rate: 3.50,
    description: "An elegant, hassle-free zero-balance savings account to store, dispatch, and track your cash securement daily.",
    eligibility_summary: "Highly accessible savings option for all citizens aged 10 and above. Zero monthly income or credit score requirements."
  },
  {
    name: "Secure Senior Nest Savings Account",
    type: "savings",
    min_age: 60,
    max_age: 99,
    min_income: 10000,
    min_credit_score: 300,
    allowed_employment_types: ['retired'],
    interest_rate: 8.00,
    description: "Specialized high-interest savings support for senior citizens, with built-in health riders and free doorstep bank delivery.",
    eligibility_summary: "Available to retired seniors aged 60 and above with a minimum monthly pension or dividend income of ₹10,000."
  },
  {
    name: "Family First Health Shield Insurance",
    type: "insurance",
    min_age: 18,
    max_age: 65,
    min_income: 25000,
    min_credit_score: 300,
    allowed_employment_types: ['salaried', 'self_employed', 'freelancer', 'retired'],
    interest_rate: 0.00,
    description: "Comprehensive medical and inpatient shield protecting your nuclear household against major diagnostic and hospitalization bills.",
    eligibility_summary: "Family protection plan open to head earners aged 18 to 65 with monthly earnings of ₹25,000 or above."
  },
  {
    name: "Young Professional Term Life Cover",
    type: "insurance",
    min_age: 18,
    max_age: 45,
    min_income: 40000,
    min_credit_score: 650,
    allowed_employment_types: ['salaried', 'self_employed'],
    interest_rate: 0.00,
    description: "Secure the livelihood of your dependents. Features massive term covers at highly optimized low premiums for career starters.",
    eligibility_summary: "Targeted to young income earners aged 18 to 45, minimum income of ₹40,000, with a credit record of 650+."
  },
  {
    name: "Golden Shield Senior Care Term",
    type: "insurance",
    min_age: 55,
    max_age: 75,
    min_income: 20000,
    min_credit_score: 550,
    allowed_employment_types: ['salaried', 'self_employed', 'retired'],
    interest_rate: 0.00,
    description: "A tailored health and terminal care cover addressing geriatric concerns and post-retirement medical therapies.",
    eligibility_summary: "Elders-only health package for ages 55 to 75, minimum monthly pension/earnings of ₹20,000+, and a credit history of 550+."
  },
  {
    name: "Standard 1-Year High-Interest FD",
    type: "fixed_deposit",
    min_age: 18,
    max_age: 99,
    min_income: 0,
    min_credit_score: 300,
    allowed_employment_types: ['salaried', 'self_employed', 'freelancer', 'retired', 'student'],
    interest_rate: 7.50,
    description: "Highly competitive fixed rate deposit with capital guarantees and compounding yields for a flat 365-day block.",
    eligibility_summary: "Age 18 and above, completely open to all work designations, requiring no min basic monthly income."
  },
  {
    name: "Senior Citizen Secured Fixed Deposit",
    type: "fixed_deposit",
    min_age: 60,
    max_age: 99,
    min_income: 0,
    min_credit_score: 300,
    allowed_employment_types: ['retired'],
    interest_rate: 8.50,
    description: "Guaranteed monthly income fixed rate pool with high senior margins to preserve your life's earnings securely.",
    eligibility_summary: "Exclusively for seniors aged 60 and above who are retired. Maximum rate allocation with no entry barriers."
  },
  {
    name: "Growth Starter Fixed Deposit",
    type: "fixed_deposit",
    min_age: 15,
    max_age: 30,
    min_income: 0,
    min_credit_score: 300,
    allowed_employment_types: ['salaried', 'student', 'freelancer'],
    interest_rate: 6.80,
    description: "Micro fixed-term account for young adults to lock small surpluses safely and learn long-term savings strategies.",
    eligibility_summary: "Designed for youths aged 15 to 30. Available to early income earners, freelancers, and students without complex documentation."
  },
  {
    name: "Platinum Executive Personal Loan",
    type: "loan",
    min_age: 25,
    max_age: 55,
    min_income: 120000,
    min_credit_score: 800,
    allowed_employment_types: ['salaried'],
    interest_rate: 8.99,
    description: "Low-markup personalized luxury tier loan with maximum amounts for corporate managers and corporate officers.",
    eligibility_summary: "Premium loan exclusive to salaried directors/executives aged 25 to 55 earning ₹120,000+ monthly with excellent credit of 800+."
  }
];

async function seed() {
  console.log('Seeding Database Catalogue...');

  // 1. Seed local JSON file
  try {
    const formattedProducts = products.map((item, index) => ({
      id: index + 1,
      ...item
    }));
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(formattedProducts, null, 2));
    console.log(`Seeded ${formattedProducts.length} items successfully into Embedded Local Database.`);
  } catch (err) {
    console.warn(`Failed to seed Embedded Local Database: ${err.message}`);
  }

  // 2. See real PostgreSQL DB if active
  const isPgConfigured = !!(process.env.PGHOST || process.env.PGUSER || process.env.DATABASE_URL);
  if (!isPgConfigured) {
    console.log('Skipping real PG seeding process as database is offline or unconfigured.');
    return;
  }

  let pool;
  try {
    const connectionString = process.env.DATABASE_URL;
    pool = connectionString 
      ? new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } })
      : new pg.Pool({
          host: process.env.PGHOST,
          port: parseInt(process.env.PGPORT || '5432', 10),
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
        });

    // Optional: truncate table to avoid duplicate seed runs
    try {
      await pool.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
    } catch (e) {
      // Ignore if table truncating fails
    }

    for (const p of products) {
      const sql = `
        INSERT INTO products (
          name, type, min_age, max_age, min_income, min_credit_score, allowed_employment_types, interest_rate, description, eligibility_summary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      const params = [
        p.name,
        p.type,
        p.min_age,
        p.max_age,
        p.min_income,
        p.min_credit_score,
        p.allowed_employment_types,
        p.interest_rate,
        p.description,
        p.eligibility_summary
      ];
      await pool.query(sql, params);
      console.log(`Successfully seeded PG database item: ${p.name}`);
    }
    console.log('PostgreSQL database seeding finished successfully.');
  } catch (err) {
    console.warn(`PostgreSQL seeding failed: ${err.message}. Relying on local seed files.`);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

seed();
