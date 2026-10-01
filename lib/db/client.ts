import "server-only";
import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

// DATABASE_URL:
//   - local dev:  "file:local.db"                 (arquivo SQLite na raiz do projeto)
//   - produção:   "libsql://<seu-db>.turso.io"     (banco Turso — SQLite distribuído,
//                                                    funciona nas funções serverless da Vercel
//                                                    porque os dados ficam fora do filesystem
//                                                    efêmero da Vercel)
// DATABASE_AUTH_TOKEN: obrigatório apenas para libsql://, gerado pelo Turso CLI.

let dbInstance: LibSQLDatabase<typeof schema> | null = null;

function isBuildTime(): boolean {
  // Check if we're in a build environment (Vercel build, Next.js build, etc.)
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build" ||
    process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === undefined ||
    process.env.CI === "true"
  );
}

function getDb(): LibSQLDatabase<typeof schema> {
  if (dbInstance) return dbInstance;

  // During build time, use a mock database to avoid filesystem issues
  if (isBuildTime()) {
    // Use an in-memory database for build time
    const client = createClient({ url: "file::memory:" });
    dbInstance = drizzle(client, { schema });
    return dbInstance;
  }

  const url = process.env.DATABASE_URL ?? "file:local.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  const client = createClient(
    url.startsWith("libsql:") ? { url, authToken } : { url }
  );

  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

// Export a typed db object that lazily initializes
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_, prop) {
    return getDb()[prop as keyof LibSQLDatabase<typeof schema>];
  },
}) as LibSQLDatabase<typeof schema>;