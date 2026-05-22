import { Request, Response } from 'express';
import { query } from '../db/pool.js';

export const explainProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { item_id } = req.params;
    const parsedId = parseInt(item_id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ error: 'Valid product item ID is required.' });
      return;
    }

    const { rows } = await query('SELECT * FROM products WHERE id = $1', [parsedId]);

    if (rows.length === 0) {
      res.status(404).json({ error: `Product item with ID ${parsedId} was not found.` });
      return;
    }

    const product = rows[0];

    // Format display income
    const minIncomeFormatted = Number(product.min_income).toLocaleString('en-IN');

    // Build the dynamic explanations listing specific values
    const dynamic_checks = {
      age: `Checks whether the user's age falls within the legal limit of ${product.min_age} to ${product.max_age} years. This boundary maintains legal contract status, ensures risk models match average life expectancies for insurance covers, and checks age-specific offerings like senior citizens or student cards.`,
      credit_score: `Checks if the user's credit score is at least ${product.min_credit_score} on a standard 300 to 900 scale. Credit ratings reflect default risk; low scores are filtered out to curb high default metrics, while high scores unlock better rates.`,
      monthly_income: `Verifies that the user's monthly income matches or exceeds ₹${minIncomeFormatted}. This metric guarantees your regular cash flow is sufficient for the product's financial obligations, such as savings account average balances, card limits, or debt repayments.`,
      employment_type: `Confirms that the user's career classification is allowed (permitted types: ${(product.allowed_employment_types || []).join(', ')}). Traditional loans and cards favor salaried persons with frequent paychecks, whereas student cards or retirement accounts cater to distinct structural profiles.`
    };

    res.json({
      product_id: product.id,
      name: product.name,
      type: product.type,
      eligibility_summary: product.eligibility_summary,
      dynamic_checks
    });
  } catch (err: any) {
    res.status(500).json({ error: `Internal server failure in explanation compiler: ${err.message}` });
  }
};
