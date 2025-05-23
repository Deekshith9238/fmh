import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: {
      ca: fs.readFileSync(path.resolve("rds-ca.pem")).toString(),
      rejectUnauthorized: true,
    },
  },
});


