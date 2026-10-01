import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const url = process.env.DATABASE_URL ?? "file:local.db";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  // "turso" cobre tanto o arquivo local (file:local.db) quanto o banco
  // remoto (libsql://...) — é o dialect certo para o driver @libsql/client.
  dialect: "turso",
  dbCredentials: {
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
