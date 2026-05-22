-- Migration 002 - Create Recommendations Log Table
CREATE TABLE IF NOT EXISTS recommendations_log (
  id SERIAL PRIMARY KEY,
  profile JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
