import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { defineConfig } from "prisma/config";

function getMigrationDatabaseUrl(): string | undefined {
  if (process.env["DIRECT_URL"]) {
    return process.env["DIRECT_URL"];
  }
  if (process.env["DATABASE_URL_UNPOOLED"]) {
    return process.env["DATABASE_URL_UNPOOLED"];
  }
  const dbUrl = process.env["DATABASE_URL"];
  if (dbUrl && dbUrl.includes("-pooler.")) {
    return dbUrl.replace("-pooler.", ".");
  }
  return dbUrl;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getMigrationDatabaseUrl(),
  },
});
