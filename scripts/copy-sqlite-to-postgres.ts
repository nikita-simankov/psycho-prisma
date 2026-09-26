// Copies everything from an existing SQLite database into the Postgres database in DATABASE_URL.
//
//   DATABASE_URL=postgresql://... npx prisma migrate deploy
//   DATABASE_URL=postgresql://... npm run db:copy-sqlite -- /path/to/prisma.db
//
// The SQLite file is never changed: it is copied to a temporary file, brought up to date with
// the SQLite migrations in prisma/sqlite-migrations, and read from there. The target must be
// empty (run this before the app's first start, which seeds it) unless --replace is given, which
// empties it first.
import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const MIGRATIONS = resolve(__dirname, "../prisma/sqlite-migrations");
// Postgres allows 65535 parameters per statement.
const MAX_PARAMETERS = 30_000;

type Column = { name: string; type: string };

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

// Applies the SQLite migrations the copy is missing, the way `prisma migrate deploy` would have.
function upgrade(sqlite: DatabaseSync) {
  const hasTable = sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '_prisma_migrations'").get();
  if (!hasTable) fail("This SQLite file has no migration history. Run `prisma migrate deploy` on it with the previous release first.");

  const applied = new Set(
    (sqlite.prepare("SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL").all() as { migration_name: string }[]).map(
      (row) => row.migration_name
    )
  );
  const pending = readdirSync(MIGRATIONS)
    .filter((name) => existsSync(join(MIGRATIONS, name, "migration.sql")))
    .sort()
    .filter((name) => !applied.has(name));

  for (const name of pending) {
    console.log(`Applying SQLite migration ${name} to the copy`);
    sqlite.exec(readFileSync(join(MIGRATIONS, name, "migration.sql"), "utf8"));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const replace = args.includes("--replace");
  const source = args.find((arg) => !arg.startsWith("--"));
  if (!source || !existsSync(source)) fail("Usage: npm run db:copy-sqlite -- /path/to/prisma.db [--replace]");
  if (!process.env.DATABASE_URL?.startsWith("postgres")) fail("Set DATABASE_URL to the Postgres database to copy into.");

  const directory = mkdtempSync(join(tmpdir(), "prisma-copy-"));
  const copy = join(directory, "source.db");
  copyFileSync(source, copy);
  const sqlite = new DatabaseSync(copy);
  const prisma = new PrismaClient();

  try {
    upgrade(sqlite);

    const tables = (
      await prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`
    ).map((row) => row.table_name);

    // Parents before children, so every foreign key finds its row.
    const references = await prisma.$queryRaw<{ child: string; parent: string }[]>`
      SELECT DISTINCT tc.table_name AS child, ccu.table_name AS parent
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = current_schema()`;
    const order: string[] = [];
    const visit = (table: string, path: string[] = []) => {
      if (order.includes(table) || path.includes(table)) return;
      for (const { parent } of references.filter((entry) => entry.child === table && entry.parent !== table)) visit(parent, [...path, table]);
      order.push(table);
    };
    tables.forEach((table) => visit(table));

    const counts = await Promise.all(
      order.map(async (table) => Number((await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT count(*) AS count FROM "${table}"`))[0].count))
    );
    if (counts.some((count) => count > 0)) {
      if (!replace) fail("The Postgres database already has data (the app seeds it on its first start). Re-run with --replace to empty it first.");
      await prisma.$executeRawUnsafe(`TRUNCATE ${order.map((table) => `"${table}"`).join(", ")} CASCADE`);
    }

    await prisma.$transaction(
      async (tx) => {
        for (const table of order) {
          const exists = sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
          if (!exists) continue;

          const columns = await tx.$queryRaw<Column[]>`
            SELECT column_name AS name, data_type AS type FROM information_schema.columns
            WHERE table_schema = current_schema() AND table_name = ${table} ORDER BY ordinal_position`;
          const sourceColumns = new Set((sqlite.prepare(`PRAGMA table_info("${table}")`).all() as { name: string }[]).map((column) => column.name));
          const missing = columns.filter((column) => !sourceColumns.has(column.name));
          if (missing.length > 0) fail(`${table} is missing ${missing.map((column) => column.name).join(", ")} in SQLite.`);

          const rows = sqlite.prepare(`SELECT ${columns.map((column) => `"${column.name}"`).join(", ")} FROM "${table}"`).all() as Record<string, unknown>[];
          const perStatement = Math.max(1, Math.floor(MAX_PARAMETERS / columns.length));

          for (let start = 0; start < rows.length; start += perStatement) {
            const batch = rows.slice(start, start + perStatement);
            const values: unknown[] = [];
            const tuples = batch.map((row) => {
              const placeholders = columns.map((column) => {
                values.push(convert(row[column.name], column.type));
                return `$${values.length}${cast(column.type)}`;
              });
              return `(${placeholders.join(", ")})`;
            });
            await tx.$executeRawUnsafe(
              `INSERT INTO "${table}" (${columns.map((column) => `"${column.name}"`).join(", ")}) VALUES ${tuples.join(", ")}`,
              ...values
            );
          }
          console.log(`${table}: ${rows.length}`);
        }
      },
      { timeout: 10 * 60 * 1000, maxWait: 60 * 1000 }
    );

    console.log("Done. Start the app with this DATABASE_URL.");
  } finally {
    sqlite.close();
    await prisma.$disconnect();
    rmSync(directory, { recursive: true, force: true });
  }
}

// Prisma stores SQLite dates as milliseconds and booleans as 0 or 1.
function convert(value: unknown, type: string) {
  if (value === null || value === undefined) return null;
  if (type.startsWith("timestamp")) return new Date(typeof value === "number" || typeof value === "bigint" ? Number(value) : String(value));
  if (type === "boolean") return Number(value) === 1 || value === true || value === "true";
  if (type === "integer" || type === "bigint") return Number(value);
  if (type === "double precision") return Number(value);
  return typeof value === "string" ? value : String(value);
}

function cast(type: string) {
  if (type.startsWith("timestamp")) return "::timestamp(3)";
  if (type === "boolean") return "::boolean";
  if (type === "integer") return "::integer";
  if (type === "double precision") return "::double precision";
  return "";
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
