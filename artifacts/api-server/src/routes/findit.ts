import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  CreateObjectBody,
  CreateObjectResponse,
  CreateObservationBody,
  CreateObservationResponse,
  GetHomeSummaryResponse,
  GetObjectParams,
  GetObjectResponse,
  ListObjectsResponse,
  ListObservationsResponse,
  LoadDemoDataResponse,
} from "@workspace/api-zod";
import {
  db,
  observationsTable,
  objectsTable,
  usersTable,
} from "@workspace/db";

const router: IRouter = Router();
const LOCAL_USER_ID = "local-user";

async function ensureLocalUser(): Promise<void> {
  await db
    .insert(usersTable)
    .values({ id: LOCAL_USER_ID })
    .onConflictDoNothing();
}

async function listObjectRows() {
  return db
    .select({
      id: objectsTable.id,
      userId: objectsTable.userId,
      name: objectsTable.name,
      category: objectsTable.category,
      description: objectsTable.description,
      referenceImage: objectsTable.referenceImage,
      createdAt: objectsTable.createdAt,
      updatedAt: objectsTable.updatedAt,
      observationCount: sql<number>`count(${observationsTable.id})::int`,
    })
    .from(objectsTable)
    .leftJoin(
      observationsTable,
      and(
        eq(observationsTable.objectId, objectsTable.id),
        eq(observationsTable.userId, LOCAL_USER_ID),
      ),
    )
    .where(eq(objectsTable.userId, LOCAL_USER_ID))
    .groupBy(objectsTable.id)
    .orderBy(desc(objectsTable.createdAt));
}

async function listObservationRows(limit?: number) {
  const query = db
    .select({
      id: observationsTable.id,
      userId: observationsTable.userId,
      objectId: observationsTable.objectId,
      objectName: objectsTable.name,
      image: observationsTable.image,
      timestamp: observationsTable.timestamp,
      latitude: observationsTable.latitude,
      longitude: observationsTable.longitude,
      locationName: observationsTable.locationName,
      detectionConfidence: observationsTable.detectionConfidence,
      source: observationsTable.source,
      createdAt: observationsTable.createdAt,
    })
    .from(observationsTable)
    .innerJoin(objectsTable, eq(observationsTable.objectId, objectsTable.id))
    .where(eq(observationsTable.userId, LOCAL_USER_ID))
    .orderBy(desc(observationsTable.timestamp));

  if (limit) {
    return query.limit(limit);
  }

  return query;
}

router.get("/objects", async (req, res): Promise<void> => {
  await ensureLocalUser();
  const rows = await listObjectRows();
  req.log.info({ count: rows.length }, "Listed FindIt objects");
  res.json(ListObjectsResponse.parse(rows));
});

router.post("/objects", async (req, res): Promise<void> => {
  await ensureLocalUser();
  const parsed = CreateObjectBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid FindIt object");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(objectsTable)
    .values({
      userId: LOCAL_USER_ID,
      name: parsed.data.name.trim(),
      category: parsed.data.category,
      description: parsed.data.description?.trim() || null,
      referenceImage: parsed.data.referenceImage || null,
    })
    .returning();

  const row = {
    ...created,
    observationCount: 0,
  };
  res.status(201).json(CreateObjectResponse.parse(row));
});

router.get("/objects/:id", async (req, res): Promise<void> => {
  await ensureLocalUser();
  const parsed = GetObjectParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = await listObjectRows();
  const object = rows.find((row) => row.id === parsed.data.id);
  if (!object) {
    res.status(404).json({ error: "Object not found" });
    return;
  }

  res.json(GetObjectResponse.parse(object));
});

router.get("/observations", async (req, res): Promise<void> => {
  await ensureLocalUser();
  const rows = await listObservationRows();
  res.json(ListObservationsResponse.parse(rows));
});

router.post("/observations", async (req, res): Promise<void> => {
  await ensureLocalUser();
  const parsed = CreateObservationBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn(
      { errors: parsed.error.message },
      "Invalid FindIt observation",
    );
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [object] = await db
    .select({ id: objectsTable.id })
    .from(objectsTable)
    .where(
      and(
        eq(objectsTable.id, parsed.data.objectId),
        eq(objectsTable.userId, LOCAL_USER_ID),
      ),
    );

  if (!object) {
    res.status(404).json({ error: "Object not found" });
    return;
  }

  const [created] = await db
    .insert(observationsTable)
    .values({
      userId: LOCAL_USER_ID,
      objectId: parsed.data.objectId,
      image: parsed.data.image,
      timestamp: parsed.data.timestamp ?? new Date(),
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      locationName: parsed.data.locationName?.trim() || null,
      source: parsed.data.source?.trim() || "manual",
    })
    .returning();

  const [row] = await listObservationRows(1);
  const createdRow = row?.id === created.id ? row : (await listObservationRows()).find((item) => item.id === created.id);
  res.status(201).json(CreateObservationResponse.parse(createdRow));
});

router.get("/home-summary", async (_req, res): Promise<void> => {
  await ensureLocalUser();
  const [objectCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(objectsTable)
    .where(eq(objectsTable.userId, LOCAL_USER_ID));
  const [observationCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(observationsTable)
    .where(eq(observationsTable.userId, LOCAL_USER_ID));
  const recentObservations = await listObservationRows(3);

  res.json(
    GetHomeSummaryResponse.parse({
      objectCount: objectCount?.count ?? 0,
      observationCount: observationCount?.count ?? 0,
      recentObservations,
    }),
  );
});

router.post("/demo-data", async (req, res): Promise<void> => {
  await ensureLocalUser();
  const demoObjects = [
    { name: "My Headphones", category: "Electronics" as const, description: "My everyday headphones." },
    { name: "My Keys", category: "Accessories" as const, description: "House and bike keys." },
    { name: "My Laptop", category: "Electronics" as const, description: "Work laptop." },
  ];

  const created = [];
  for (const demo of demoObjects) {
    const existing = await db
      .select({ id: objectsTable.id })
      .from(objectsTable)
      .where(
        and(
          eq(objectsTable.userId, LOCAL_USER_ID),
          eq(objectsTable.name, demo.name),
        ),
      );
    if (existing.length > 0) continue;

    const [object] = await db
      .insert(objectsTable)
      .values({ userId: LOCAL_USER_ID, ...demo })
      .returning();
    created.push({ ...object, observationCount: 0 });
  }

  res.status(201).json(LoadDemoDataResponse.parse(created));
});

export default router;