import { integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { objectsTable } from "./objects";
import { usersTable } from "./users";

export const observationsTable = pgTable("observations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id),
  objectId: integer("object_id")
    .notNull()
    .references(() => objectsTable.id),
  image: text("image"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationName: text("location_name"),
  detectionConfidence: real("detection_confidence"),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InsertObservation = typeof observationsTable.$inferInsert;
export type ObservationRecord = typeof observationsTable.$inferSelect;