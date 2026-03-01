import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const participantState = sqliteTable("participant_state", {
  participantId: text("participant_id").primaryKey(),
  email: text("email").notNull(),
  status: text("status").notNull().default("awaiting"),
  isOfficer: integer("is_officer", { mode: "boolean" })
    .notNull()
    .default(false),
  appNotes: text("app_notes").notNull().default(""),
  carId: text("car_id"),
  seatIndex: integer("seat_index"),
  checkInState: text("check_in_state"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const cars = sqliteTable("cars", {
  id: text("id").primaryKey(),
  driverId: text("driver_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
