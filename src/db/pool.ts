import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const LOGS_FILE = path.join(DATA_DIR, 'recommendations_log.json');

// Ensure data directory and fallback files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(LOGS_FILE)) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2));
}

class InMemoryDb {
  private getProducts(): any[] {
    try {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  private saveProducts(products: any[]) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  }

  private getLogs(): any[] {
    try {
      const data = fs.readFileSync(LOGS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  private saveLogs(logs: any[]) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
  }

  public query(text: string, params: any[] = []): any {
    const sql = text.trim().replace(/\s+/g, ' ');

    // 1. SELECT * FROM products WHERE id = $1
    if (sql.match(/SELECT \* FROM products WHERE id = \$1/i)) {
      const id = parseInt(params[0], 10);
      const products = this.getProducts();
      const product = products.find(p => p.id === id);
      return { rows: product ? [product] : [] };
    }

    // 2. SELECT * FROM products
    if (sql.match(/SELECT \* FROM products/i)) {
      return { rows: this.getProducts() };
    }

    // 3. INSERT INTO products
    if (sql.match(/INSERT INTO products/i)) {
      const products = this.getProducts();
      const nextId = products.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;

      const product = {
        id: nextId,
        name: params[0],
        type: params[1],
        min_age: parseInt(params[2], 10),
        max_age: parseInt(params[3], 10),
        min_income: parseFloat(params[4]),
        min_credit_score: parseInt(params[5], 10),
        allowed_employment_types: Array.isArray(params[6]) ? params[6] : this.parsePostgresArray(params[6]),
        interest_rate: parseFloat(params[7]),
        description: params[8],
        eligibility_summary: params[9]
      };
      products.push(product);
      this.saveProducts(products);
      return { rows: [product] };
    }

    // 4. UPDATE products
    if (sql.match(/UPDATE products/i)) {
      const products = this.getProducts();
      // ID is the last parameter
      const id = parseInt(params[params.length - 1], 10);
      const index = products.findIndex(p => p.id === id);
      if (index === -1) {
        return { rows: [] };
      }
      const existing = products[index];
      const updated = {
        ...existing,
        name: params[0] !== undefined ? params[0] : existing.name,
        type: params[1] !== undefined ? params[1] : existing.type,
        min_age: params[2] !== undefined ? parseInt(params[2], 10) : existing.min_age,
        max_age: params[3] !== undefined ? parseInt(params[3], 10) : existing.max_age,
        min_income: params[4] !== undefined ? parseFloat(params[4]) : existing.min_income,
        min_credit_score: params[5] !== undefined ? parseInt(params[5], 10) : existing.min_credit_score,
        allowed_employment_types: params[6] !== undefined ? (Array.isArray(params[6]) ? params[6] : this.parsePostgresArray(params[6])) : existing.allowed_employment_types,
        interest_rate: params[7] !== undefined ? parseFloat(params[7]) : existing.interest_rate,
        description: params[8] !== undefined ? params[8] : existing.description,
        eligibility_summary: params[9] !== undefined ? params[9] : existing.eligibility_summary,
      };
      products[index] = updated;
      this.saveProducts(products);
      return { rows: [updated] };
    }

    // 5. DELETE FROM products WHERE id = $1
    if (sql.match(/DELETE FROM products WHERE id = \$1/i)) {
      const id = parseInt(params[0], 10);
      const products = this.getProducts();
      const index = products.findIndex(p => p.id === id);
      if (index === -1) {
        return { rows: [] };
      }
      const deleted = products.splice(index, 1)[0];
      this.saveProducts(products);
      return { rows: [deleted] };
    }

    // 6. INSERT INTO recommendations_log
    if (sql.match(/INSERT INTO recommendations_log/i)) {
      const logs = this.getLogs();
      const nextId = logs.reduce((max, l) => l.id > max ? l.id : max, 0) + 1;
      const log = {
        id: nextId,
        profile: typeof params[0] === 'string' ? JSON.parse(params[0]) : params[0],
        results: typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1],
        created_at: new Date().toISOString()
      };
      logs.push(log);
      this.saveLogs(logs);
      return { rows: [log] };
    }

    // 7. SELECT * FROM recommendations_log
    if (sql.match(/SELECT \* FROM recommendations_log/i)) {
      return { rows: this.getLogs() };
    }

    return { rows: [] };
  }

  private parsePostgresArray(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[{}]/g, '');
      return cleaned.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }
    return [];
  }
}

const fallbackDb = new InMemoryDb();

const isPgConfigured = !!(
  process.env.PGHOST ||
  process.env.PGUSER ||
  process.env.DATABASE_URL
);

let pool: any;
let useFallback = true;

if (isPgConfigured) {
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
    useFallback = false;
    console.log('PostgreSQL Client initialized with external database configuration.');
  } catch (err: any) {
    console.warn(`PostgreSQL initialization failed. Falling back to Embedded DB. Error: ${err.message}`);
    useFallback = true;
  }
} else {
  console.log('No external PostgreSQL client configuration parameters found. Using Built-in High-Fidelity JSON DB Fallback.');
}

export const query = async (text: string, params: any[] = []): Promise<any> => {
  if (useFallback) {
    return fallbackDb.query(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (err: any) {
    // If connection gets refused or database doesn't exist, fallback gracefully rather than shutting down
    if (err.message.includes('ECONNREFUSED') || err.message.includes('does not exist')) {
      console.warn(`PostgreSQL Server is offline. Gracefully falling back to Embedded JSON DB. Query failed: ${err.message}`);
      useFallback = true;
      return fallbackDb.query(text, params);
    }
    throw err;
  }
};

export const end = async (): Promise<void> => {
  if (!useFallback && pool) {
    await pool.end();
  }
};
