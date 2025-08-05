import { config } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Load environment variables
config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please add your Neon database connection string to .env file",
  );
}

console.log('[DB] Connecting to database...');
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Test connection
pool.query('SELECT NOW()').then(() => {
  console.log('[DB] ✅ Database connected successfully');
}).catch((error) => {
  console.error('[DB] ❌ Database connection failed:', error);
});