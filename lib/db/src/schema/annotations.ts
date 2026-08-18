import { integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { objectsTable } from "./objects";
import { observationsTable } from "./observations";

export const annotationsTable = pgTable("annotations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  observationId: integer("observation_id")
    .notNull()
    .references(() => observationsTable.id, { onDelete: "cascade" }),
  objectId: integer("object_id")
    .notNull()
    .references(() => objectsTable.id),
  x: real("x").notNull(),
  y: real("y").notNull(),
  width: real("width").notNull(),
  height: real("height").notNull(),
  imageWidth: integer("image_width").notNull(),
  imageHeight: integer("image_height").notNull(),
  classId: integer("class_id"),
  className: text("class_name"),
  annotationFormat: text("annotation_format").notNull().default("xywh-normalized"),
  datasetId: text("dataset_id"),
  trainingSessionId: text("training_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertAnnotation = typeof annotationsTable.$inferInsert;
export type AnnotationRecord = typeof annotationsTable.$inferSelect;