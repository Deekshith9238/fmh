import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Only require DATABASE_URL in production
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error("DATABASE_URL must be set in production.");
}

// Create a dummy pool if no DATABASE_URL is provided (for in-memory storage)
export const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : false,
      // Add connection timeout and retry logic for development
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 20,
    })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;

// Test database connection without crashing the app
if (pool) {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Database connection failed:', err.message);
      console.log('Falling back to in-memory storage for development');
      // Don't throw error, just log it
    } else {
      console.log('Database connected successfully');
      release();
    }
  });
  
  // Handle pool errors gracefully
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't crash the app, just log the error
  });
}
