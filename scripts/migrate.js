import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const migrationsDir = path.resolve('migrations');
const DATA_DIR = path.resolve('data');

// Make sure paths exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(path.join(DATA_DIR, 'products.json'))) {
  fs.writeFileSync(path.join(DATA_DIR, 'products.json'), JSON.stringify([], null, 2));
}
if (!fs.existsSync(path.join(DATA_DIR, 'recommendations_log.json'))) {
  fs.writeFileSync(path.join(DATA_DIR, 'recommendations_log.json'), JSON.stringify([], null, 2));
}

async function runMigrations() {
  console.log('Starting Database Migrations...');
  
  const isPgConfigured = !!(process.env.PGHOST || process.env.PGUSER || process.env.DATABASE_URL);
  
  if (!isPgConfigured) {
    console.log('No external PG configuration detected. Built-in Embedded JSON database initialized successfully.');
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

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Executing migration file: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`Completed migration file: ${file}`);
    }
    console.log('All PostgreSQL migrations completed successfully.');
  } catch (err) {
    console.warn(`PostgreSQL migrations failed or offline: ${err.message}. Bypassing database schema binding.`);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

runMigrations();
