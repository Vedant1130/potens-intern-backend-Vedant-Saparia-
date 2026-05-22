import { Request, Response } from 'express';
import { query } from '../db/pool.js';

export const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query('SELECT * FROM products ORDER BY id ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to retrieve catalogue: ${err.message}` });
  }
};

export const createItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      type,
      min_age,
      max_age,
      min_income,
      min_credit_score,
      allowed_employment_types,
      interest_rate,
      description,
      eligibility_summary,
    } = req.body;

    const sql = `
      INSERT INTO products (
        name, type, min_age, max_age, min_income, min_credit_score, allowed_employment_types, interest_rate, description, eligibility_summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const params = [
      name,
      type,
      parseInt(min_age, 10),
      parseInt(max_age, 10),
      parseFloat(min_income),
      parseInt(min_credit_score, 10),
      allowed_employment_types,
      parseFloat(interest_rate),
      description,
      eligibility_summary,
    ];

    const { rows } = await query(sql, params);
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to create new product item: ${err.message}` });
  }
};

export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ error: 'Valid product ID is required.' });
      return;
    }

    // Support partial updates by fetching current, then re-validating or simply passing values
    const { rows: checkRows } = await query('SELECT * FROM products WHERE id = $1', [parsedId]);
    if (checkRows.length === 0) {
      res.status(404).json({ error: `Product with ID ${parsedId} not found.` });
      return;
    }

    const existing = checkRows[0];

    const name = req.body.name !== undefined ? req.body.name : existing.name;
    const type = req.body.type !== undefined ? req.body.type : existing.type;
    const min_age = req.body.min_age !== undefined ? parseInt(req.body.min_age, 10) : existing.min_age;
    const max_age = req.body.max_age !== undefined ? parseInt(req.body.max_age, 10) : existing.max_age;
    const min_income = req.body.min_income !== undefined ? parseFloat(req.body.min_income) : existing.min_income;
    const min_credit_score = req.body.min_credit_score !== undefined ? parseInt(req.body.min_credit_score, 10) : existing.min_credit_score;
    const allowed_employment_types = req.body.allowed_employment_types !== undefined ? req.body.allowed_employment_types : existing.allowed_employment_types;
    const interest_rate = req.body.interest_rate !== undefined ? parseFloat(req.body.interest_rate) : existing.interest_rate;
    const description = req.body.description !== undefined ? req.body.description : existing.description;
    const eligibility_summary = req.body.eligibility_summary !== undefined ? req.body.eligibility_summary : existing.eligibility_summary;

    const sql = `
      UPDATE products SET
        name = $1,
        type = $2,
        min_age = $3,
        max_age = $4,
        min_income = $5,
        min_credit_score = $6,
        allowed_employment_types = $7,
        interest_rate = $8,
        description = $9,
        eligibility_summary = $10
      WHERE id = $11
      RETURNING *
    `;

    const params = [
      name,
      type,
      min_age,
      max_age,
      min_income,
      min_credit_score,
      allowed_employment_types,
      interest_rate,
      description,
      eligibility_summary,
      parsedId,
    ];

    const { rows } = await query(sql, params);
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to update product item: ${err.message}` });
  }
};

export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ error: 'Valid product ID is required.' });
      return;
    }

    const { rows } = await query('DELETE FROM products WHERE id = $1 RETURNING *', [parsedId]);

    if (rows.length === 0) {
      res.status(404).json({ error: `Product with ID ${parsedId} does not exist.` });
      return;
    }

    res.json({ message: 'Product deleted successfully.', item: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to delete product item: ${err.message}` });
  }
};
