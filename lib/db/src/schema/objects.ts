import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const objectCategoryEnum = pgEnum("object_category", [
  "Electronics",
  "Accessories",
  "Documents",
  "Clothing",
  "Household",
  "Other",
]);

export const objectsTable = pgTable("objects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id),
  name: text("name").notNull(),
  category: objectCategoryEnum("category").notNull(),
  description: text("description"),
  referenceImage: text("reference_image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type InsertObject = typeof objectsTable.$inferInsert;
export type ObjectRecord = typeof objectsTable.$inferSelect;