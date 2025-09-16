 import { drizzle } from "drizzle-orm/node-postgres";
 import { Pool } from "pg";
 import * as schema from "./schema"; // adjust path
 import dotenv from 'dotenv';
dotenv.config();

 // Rely on Next.js to load env vars (e.g., from .env.local) and injected runtime vars in production.
 const databaseUrl = process.env.DATABASE_URL;
 if (!databaseUrl) {
   throw new Error("DATABASE_URL is not set. Please define it in your environment (e.g., .env).");
 }

 // Configure SSL only when explicitly requested (e.g., Neon/Render provide sslmode=require)
 const sslMode = process.env.PGSSLMODE || process.env.SSLMODE || "";
 const databaseSsl = process.env.DATABASE_SSL || "";
 const useSsl = [sslMode.toLowerCase(), databaseSsl.toLowerCase()].some((v) => v === "require" || v === "true");

 export const pool = new Pool({
   connectionString: databaseUrl,
   ssl: useSsl ? { rejectUnauthorized: false } : undefined,
 });

 export const db = drizzle(pool, { schema });
