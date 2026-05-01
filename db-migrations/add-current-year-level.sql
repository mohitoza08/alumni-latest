-- Migration: Add current_year_level to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_year_level VARCHAR(10);
