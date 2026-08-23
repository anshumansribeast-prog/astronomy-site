/* ===================================================================
   db/client.js — opens the database and applies the schema.

   Uses node:sqlite (built into Node 22.5+) — same choice cosmos-v2
   made, for the same reason: zero installs, no C++ build tools needed
   on a Windows laptop for a native module.
   =================================================================== */

import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/* Where the database file lives. ASTRO_DATA_DIR lets a real deploy
   point this at a mounted disk (see cosmos-v2's db/client.js for the
   full reasoning) — without it, a hosting container's filesystem
   resets on every restart and every account silently vanishes. */
export const DATA_DIR = process.env.ASTRO_DATA_DIR || join(here, "..", "..", "data");

export const STORAGE_IS_PERSISTENT = Boolean(process.env.ASTRO_DATA_DIR);

export function openDatabase(file = "astronomy.db") {
  let path = file;

  if (file !== ":memory:") {
    mkdirSync(DATA_DIR, { recursive: true });
    path = join(DATA_DIR, file);
  }

  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  if (file !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  db.exec(readFileSync(join(here, "schema.sql"), "utf8"));

  // Migration for databases created before apod_url existed:
  // CREATE TABLE IF NOT EXISTS won't add the column to an old file.
  try {
    db.exec("ALTER TABLE beast_brain_days ADD COLUMN apod_url TEXT");
  } catch {
    /* column already exists */
  }

  return db;
}
