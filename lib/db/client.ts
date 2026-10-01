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

function getDb(): LibSQLDatabase<typeof schema> {
  if (dbInstance) return dbInstance;

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