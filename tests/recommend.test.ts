import request from 'supertest';
import app from '../src/app.js';

describe('Financial Product Recommendation Engine API - /api/recommend', () => {
  // Test case 1: Valid profile returns exactly 3 ranked results (deterministic order)
  it('should return exactly 3 ranked results for a typical middle-income salaried profile', async () => {
    const payload = {
      age: 30,
      monthly_income: 45000,
      credit_score: 700,
      employment_type: 'salaried',
      existing_loans: 1
    };

    const res = await request(app)
      .post('/api/recommend')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendations');
    expect(res.body.recommendations).toBeInstanceOf(Array);
    expect(res.body.recommendations).toHaveLength(3);

    // Verify key recommendation result structures
    const recs = res.body.recommendations;
    expect(recs[0]).toHaveProperty('product_id');
    expect(recs[0]).toHaveProperty('name');
    expect(recs[0]).toHaveProperty('type');
    expect(recs[0]).toHaveProperty('score');
    expect(recs[0]).toHaveProperty('reason');

    // Confirm ranking order (deterministic high to low score)
    expect(recs[0].score).toBeGreaterThanOrEqual(recs[1].score);
    expect(recs[1].score).toBeGreaterThanOrEqual(recs[2].score);
  });

  // Test case 2: Profile with low credit score gets zero matches or fewer than 3
  it('should return zero matches if low credit score user filters for loans', async () => {
    const payload = {
      age: 28,
      monthly_income: 30000,
      credit_score: 400, // Very low credit rating
      employment_type: 'salaried',
      existing_loans: 0,
      preferred_product_type: 'loan' // Minimum loan requirement is 600
    };

    const res = await request(app)
      .post('/api/recommend')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendations');
    expect(res.body.recommendations).toHaveLength(0);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('No financial products matched');
  });

  // Test case 3: Missing required fields returning 400 with a clear error
  it('should reject with 400 Bad Request when mandatory fields are missing', async () => {
    const payload = {
      // missing age parameter
      monthly_income: 45000,
      credit_score: 700,
      employment_type: 'salaried',
      existing_loans: 1
    };

    const res = await request(app)
      .post('/api/recommend')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Required field age is missing');
  });

  it('should reject with 400 Bad Request when credit score boundaries are breached', async () => {
    const payload = {
      age: 35,
      monthly_income: 45000,
      credit_score: 950, // Breaches max standard 900
      employment_type: 'salaried',
      existing_loans: 1
    };

    const res = await request(app)
      .post('/api/recommend')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Credit score must be an integer between 300 and 900');
  });

  // Test case 4: Profile that matches only 1 product returns exactly 1 result without padding
  it('should return exactly 1 recommendation (no padding) when targeting a restrictive type', async () => {
    const payload = {
      age: 19,
      monthly_income: 1000,
      credit_score: 350,
      employment_type: 'student',
      existing_loans: 0,
      preferred_product_type: 'credit_card' // Only Student Builder Card should qualify
    };

    const res = await request(app)
      .post('/api/recommend')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendations');
    expect(res.body.recommendations).toHaveLength(1);
    expect(res.body.recommendations[0].name).toBe('Student Builder Credit Card');
    expect(res.body).toHaveProperty('note');
    expect(res.body.note).toContain('Only 1 product matched your profile parameters');
  });

  // Test case 5: Boundary conditions - exactly at edge of eligibility
  it('should match products when user is exactly at the minimum eligibility boundaries', async () => {
    // Premium Slate Personal Loan boundaries: min_age: 21, min_income: 50000, min_credit_score: 750, employment: salaried
    const boundaryMatchPayload = {
      age: 21, // exactly min age
      monthly_income: 50000, // exactly min income
      credit_score: 750, // exactly min score
      employment_type: 'salaried',
      existing_loans: 0,
      preferred_product_type: 'loan'
    };

    const res = await request(app)
      .post('/api/recommend')
      .send(boundaryMatchPayload);

    expect(res.status).toBe(200);
    expect(res.body.recommendations).toBeInstanceOf(Array);
    
    // Ensure the Premium Slate Personal Loan got matching entry
    const matchingNames = res.body.recommendations.map((r: any) => r.name);
    expect(matchingNames).toContain('Premium Slate Personal Loan');
  });

  it('should reject specific products when user is exactly 1 unit below any eligibility boundary', async () => {
    // 1 range parameter below min_credit_score of 750 for Premium Slate
    const boundaryFailPayload = {
      age: 21,
      monthly_income: 50000,
      credit_score: 749, // 1 point below 750
      employment_type: 'salaried',
      existing_loans: 0,
      preferred_product_type: 'loan'
    };

    const res = await request(app)
      .post('/api/recommend')
      .send(boundaryFailPayload);

    expect(res.status).toBe(200);
    const matchingNames = res.body.recommendations.map((r: any) => r.name);
    expect(matchingNames).not.toContain('Premium Slate Personal Loan');
  });
});
