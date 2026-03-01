import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";

const dbPath =
  process.env.DATABASE_URL?.replace("file:", "") ?? "./db/event-ops.db";
const absoluteDbPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath);

const sqlite = new Database(absoluteDbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.exec(`
CREATE TABLE IF NOT EXISTS participant_state (
  participant_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting',
  is_officer INTEGER NOT NULL DEFAULT 0,
  app_notes TEXT NOT NULL DEFAULT '',
  preferred_ride_partners TEXT NOT NULL DEFAULT '',
  driver INTEGER,
  self_driver INTEGER,
  seats INTEGER,
  car_id TEXT,
  seat_index INTEGER,
  check_in_state TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cars (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`);

const participantColumns = sqlite
  .prepare("PRAGMA table_info(participant_state)")
  .all() as Array<{ name: string }>;

if (!participantColumns.some((column) => column.name === "seat_index")) {
  sqlite.exec("ALTER TABLE participant_state ADD COLUMN seat_index INTEGER");
}

if (
  !participantColumns.some((column) => column.name === "preferred_ride_partners")
) {
  sqlite.exec(
    "ALTER TABLE participant_state ADD COLUMN preferred_ride_partners TEXT NOT NULL DEFAULT ''"
  );
}

if (!participantColumns.some((column) => column.name === "seats")) {
  sqlite.exec("ALTER TABLE participant_state ADD COLUMN seats INTEGER");
}

if (!participantColumns.some((column) => column.name === "driver")) {
  sqlite.exec("ALTER TABLE participant_state ADD COLUMN driver INTEGER");
}

if (!participantColumns.some((column) => column.name === "self_driver")) {
  sqlite.exec("ALTER TABLE participant_state ADD COLUMN self_driver INTEGER");
}

export const db = drizzle(sqlite);
