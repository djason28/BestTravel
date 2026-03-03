import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClient } from "@libsql/client/web";
import { sign, verify } from "hono/jwt";
import { z } from "zod";

type Env = {
  MY_BUCKET: R2Bucket;
  APP_URL?: string;
  APP_ENV?: string;
  DB_DRIVER?: string;
  JWT_SECRET?: string;
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
};

type HonoEnv = { Bindings: Env };

const app = new Hono<HonoEnv>();

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const sanitizeFilename = (input: string) => {
  const cleaned = input.trim().replace(/\\/g, "/").split("/").pop() ?? "";
  return cleaned.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const sanitizeObjectKey = (input: string) => {
  const normalized = input.trim().replace(/\\/g, "/");
  return normalized
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "_"))
    .join("/");
};

const resolveDbDriver = (env: Env) => {
  const byDriver = env.DB_DRIVER?.toLowerCase();
  if (byDriver === "turso" || byDriver === "mysql") return byDriver;
  const appEnv = env.APP_ENV?.toLowerCase();
  if (appEnv === "production") return "turso";
  if (appEnv === "staging") return "mysql";
  return "none";
};

const normalizeTursoUrl = (url: string) => {
  if (url.startsWith("libsql://")) {
    return url.replace("libsql://", "https://");
  }
  return url;
};

const originalFetch = globalThis.fetch;

const getTursoClient = (env: Env) => {
  if (!env.TURSO_DATABASE_URL) {
    throw new Error("TURSO_DATABASE_URL is required for Turso driver");
  }
  if (!env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_AUTH_TOKEN is required for Turso driver");
  }
  const wrappedFetch: typeof fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input);
    if (url.includes("/v1/jobs")) {
      return new Response("{}", {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };
  // libsql migrations helper uses global fetch; override to bypass AWS /v1/jobs 400
  if (globalThis.fetch !== wrappedFetch) {
    globalThis.fetch = wrappedFetch;
  }
  return createClient({
    url: normalizeTursoUrl(env.TURSO_DATABASE_URL),
    authToken: env.TURSO_AUTH_TOKEN,
    fetch: wrappedFetch,
  });
};

const packageInputSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1),
    titleZh: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional().default(""),
    descriptionZh: z.string().optional().default(""),
    shortDescription: z.string().optional().default(""),
    shortDescriptionZh: z.string().optional().default(""),
    price: z.number().int().nonnegative().optional().default(0),
    currency: z.string().min(1).optional().default("IDR"),
    imageUrl: z.string().url().optional(),
    images: z
      .array(
        z.object({
          url: z
            .string()
            .min(1)
            .refine(
              (value) => value.startsWith("/") || value.startsWith("http"),
              "Invalid url",
            ),
          alt: z.string().optional(),
          order: z.number().optional(),
          isCover: z.boolean().optional(),
        }),
      )
      .optional(),
    destination: z.string().optional().default(""),
    destinationZh: z.string().optional().default(""),
    duration: z.number().int().optional().default(1),
    durationUnit: z.string().optional().default("days"),
    availability: z.string().optional().default(""),
    availabilityZh: z.string().optional().default(""),
    maxParticipants: z.number().int().optional().default(1),
    categories: z.array(z.string()).optional().default([]),
    categoriesZh: z.array(z.string()).optional().default([]),
    highlights: z.array(z.string()).optional().default([]),
    highlightsZh: z.array(z.string()).optional().default([]),
    included: z.array(z.string()).optional().default([]),
    includedZh: z.array(z.string()).optional().default([]),
    excluded: z.array(z.string()).optional().default([]),
    excludedZh: z.array(z.string()).optional().default([]),
    itinerary: z.array(z.any()).optional().default([]),
    featured: z.boolean().optional().default(false),
    status: z.string().optional().default("draft"),
  })
  .passthrough();

const packageUpdateSchema = packageInputSchema.partial();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const getJwtSecret = (env: Env) =>
  env.JWT_SECRET || "dev-worker-jwt-secret-change-me";

const readBearerToken = (authHeader?: string | null) => {
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
};

const getCurrentUser = async (c: {
  env: Env;
  req: { header: (name: string) => string | undefined };
}) => {
  const token = readBearerToken(c.req.header("authorization") ?? null);
  if (!token) return null;
  try {
    const payload = await verify(token, getJwtSecret(c.env), "HS256");
    return {
      id: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? "Admin"),
      role: String(payload.role ?? "admin"),
    };
  } catch {
    return null;
  }
};

const parseJsonArray = (value: unknown) => {
  if (!value) return [] as string[];
  if (Array.isArray(value)) return value as string[];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseJsonList = (value: unknown) => {
  if (!value) return [] as any[];
  if (Array.isArray(value)) return value as any[];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseJsonImages = (value: unknown) => {
  if (!value)
    return [] as Array<{
      id: string;
      url: string;
      alt: string;
      order: number;
      isCover: boolean;
    }>;
  if (Array.isArray(value)) return value as any;
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

let packagesSchemaReady = false;
const ensurePackagesSchema = async (db: ReturnType<typeof createClient>) => {
  if (packagesSchemaReady) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      short_description TEXT,
      title_zh TEXT,
      short_description_zh TEXT,
      description_zh TEXT,
      price INTEGER,
      currency TEXT DEFAULT 'IDR',
      duration INTEGER,
      duration_unit TEXT DEFAULT 'days',
      destination TEXT,
      destination_zh TEXT,
      availability TEXT,
      availability_zh TEXT,
      max_participants INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      inquiry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      image_url TEXT,
      images_json TEXT,
      categories_json TEXT,
      categories_zh_json TEXT,
      highlights_json TEXT,
      highlights_zh_json TEXT,
      included_json TEXT,
      included_zh_json TEXT,
      excluded_json TEXT,
      excluded_zh_json TEXT,
      itinerary_json TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const columnsRs = await db.execute("PRAGMA table_info(packages)");
  const existing = new Set(columnsRs.rows.map((r) => String((r as any).name)));
  const addColumn = async (name: string, type: string) => {
    if (existing.has(name)) return;
    await db.execute(`ALTER TABLE packages ADD COLUMN ${name} ${type}`);
  };

  await addColumn("short_description", "TEXT");
  await addColumn("title_zh", "TEXT");
  await addColumn("short_description_zh", "TEXT");
  await addColumn("description_zh", "TEXT");
  await addColumn("duration", "INTEGER");
  await addColumn("duration_unit", "TEXT");
  await addColumn("destination", "TEXT");
  await addColumn("destination_zh", "TEXT");
  await addColumn("availability", "TEXT");
  await addColumn("availability_zh", "TEXT");
  await addColumn("max_participants", "INTEGER");
  await addColumn("featured", "INTEGER");
  await addColumn("view_count", "INTEGER");
  await addColumn("inquiry_count", "INTEGER");
  await addColumn("image_url", "TEXT");
  await addColumn("images_json", "TEXT");
  await addColumn("categories_json", "TEXT");
  await addColumn("categories_zh_json", "TEXT");
  await addColumn("highlights_json", "TEXT");
  await addColumn("highlights_zh_json", "TEXT");
  await addColumn("included_json", "TEXT");
  await addColumn("included_zh_json", "TEXT");
  await addColumn("excluded_json", "TEXT");
  await addColumn("excluded_zh_json", "TEXT");
  await addColumn("itinerary_json", "TEXT");

  packagesSchemaReady = true;
};

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.APP_URL;
      if (!origin) return allowed || "http://localhost:5173";
      if (allowed && origin === allowed) return origin;
      if (origin.startsWith("http://localhost:")) return origin;
      return allowed || "http://localhost:5173";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// --- Routes ---
app.get("/", (c) =>
  c.json({
    status: "ok",
    service: "besttravel-worker",
    time: new Date().toISOString(),
  }),
);

// Upload Image ke R2
app.put("/api/upload/:filename", async (c) => {
  const bucket = c.env.MY_BUCKET;
  const rawFilename = c.req.param("filename");
  const filename = sanitizeFilename(rawFilename);
  if (!filename) {
    return c.json({ ok: false, error: "Invalid filename" }, 400);
  }

  const contentLength = Number(c.req.header("content-length") ?? "0");
  if (contentLength > MAX_UPLOAD_BYTES) {
    return c.json({ ok: false, error: "File too large (max 10MB)" }, 413);
  }

  const contentType =
    c.req.header("content-type") || "application/octet-stream";

  // Baca body request
  const body = await c.req.arrayBuffer();

  // Simpan ke R2
  await bucket.put(filename, body, {
    httpMetadata: { contentType },
  });

  return c.json({
    success: true,
    message: "Upload success",
    filename,
    url: `/images/${filename}`,
  });
});

app.post("/api/upload/image", async (c) => {
  const bucket = c.env.MY_BUCKET;
  const form = await c.req.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "packages").trim() || "packages";

  if (!(file instanceof File)) {
    return c.json({ success: false, error: "file is required" }, 400);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json({ success: false, error: "File too large (max 10MB)" }, 413);
  }

  const safeName = sanitizeFilename(file.name || `upload-${Date.now()}`);
  const key = `${sanitizeFilename(folder)}/${Date.now()}-${safeName}`;
  const bytes = await file.arrayBuffer();
  const contentType = file.type || "application/octet-stream";

  await bucket.put(key, bytes, { httpMetadata: { contentType } });

  return c.json({
    success: true,
    data: {
      url: `/images/${key}`,
    },
  });
});

app.delete("/api/upload/image", async (c) => {
  const bucket = c.env.MY_BUCKET;
  const body = await c.req.json().catch(() => ({}) as { url?: string });
  const url = String(body.url ?? "").trim();
  if (!url) {
    return c.json({ success: false, error: "url is required" }, 400);
  }

  const key = url.replace(/^https?:\/\/[^/]+\//, "").replace(/^images\//, "");
  await bucket.delete(key);
  return c.json({ success: true });
});

// Serve Image dari R2
app.get("/images/*", async (c) => {
  const bucket = c.env.MY_BUCKET;
  const rawParam = c.req.param("*") ?? "";
  const path = c.req.path || "";
  const fromPath = path.startsWith("/images/")
    ? path.slice("/images/".length)
    : "";
  const rawKey = decodeURIComponent(rawParam || fromPath);
  const key = sanitizeObjectKey(rawKey);
  if (!key) {
    return c.text("Invalid filename", 400);
  }

  const object = await bucket.get(key);

  if (!object) {
    return c.text("Image not found", 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, {
    headers,
  });
});

app.get("/api/db/health", async (c) => {
  const driver = resolveDbDriver(c.env);

  if (driver === "turso") {
    try {
      const db = getTursoClient(c.env);
      const rs = await db.execute("select 1 as ok");
      return c.json({ ok: true, driver, rows: rs.rows });
    } catch (e: any) {
      return c.json({ ok: false, driver, error: e?.message ?? "unknown" }, 500);
    }
  }

  if (driver === "mysql") {
    return c.json(
      {
        ok: false,
        driver,
        error:
          "Cloudflare Workers tidak bisa konek langsung ke MySQL (TCP). Gunakan HTTP proxy/service atau pindahkan staging ke Turso.",
      },
      501,
    );
  }

  return c.json({
    ok: true,
    driver: "none",
    note: "Set APP_ENV/DB_DRIVER to enable DB access",
  });
});

app.post("/api/auth/login", async (c) => {
  const driver = resolveDbDriver(c.env);
  if (driver !== "turso") {
    return c.json({ success: false, error: "DB driver is not Turso" }, 503);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: "invalid request body" }, 400);
  }

  const db = getTursoClient(c.env);
  await ensurePackagesSchema(db);

  let rs;
  try {
    rs = await db.execute({
      sql: "SELECT id, email, password_hash, name, role FROM users WHERE lower(email)=lower(?) LIMIT 1",
      args: [parsed.data.email],
    });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message ?? "DB error" }, 500);
  }

  if (rs.rows.length === 0) {
    return c.json({ success: false, error: "invalid credentials" }, 401);
  }

  const row = rs.rows[0] as Record<string, unknown>;
  const stored = String(row.password_hash ?? "");
  if (stored !== parsed.data.password) {
    return c.json({ success: false, error: "invalid credentials" }, 401);
  }

  const user = {
    id: String(row.id ?? ""),
    email: String(row.email ?? parsed.data.email),
    name: String(row.name ?? "Admin"),
    role: String(row.role ?? "admin"),
  };
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: now,
      exp: now + 86400,
    },
    getJwtSecret(c.env),
  );

  return c.json({ success: true, token, user });
});

app.post("/api/auth/refresh", async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ success: false, error: "invalid token" }, 401);

  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: now,
      exp: now + 86400,
    },
    getJwtSecret(c.env),
  );
  return c.json({ success: true, token, user });
});

app.post("/api/auth/logout", async (c) => c.json({ success: true }));

app.get("/api/auth/me", async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ success: false, error: "invalid token" }, 401);
  return c.json({ success: true, data: user });
});

// Create package (stores metadata in Turso; image should be uploaded first and pass imageUrl)
app.post("/api/packages", async (c) => {
  const driver = resolveDbDriver(c.env);
  if (driver !== "turso") {
    return c.json({ success: false, error: "DB driver is not Turso" }, 503);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (err: any) {
    return c.json({ success: false, error: "invalid request body" }, 400);
  }

  let data;
  try {
    data = packageInputSchema.parse(body);
  } catch (err: any) {
    return c.json(
      { success: false, error: err?.message ?? "Validation error" },
      400,
    );
  }

  const db = getTursoClient(c.env);
  await ensurePackagesSchema(db);

  const id = data.id ?? crypto.randomUUID();
  const slug =
    data.slug && data.slug.trim() ? data.slug.trim() : slugify(data.title);
  const imageUrl =
    data.imageUrl ||
    data.images?.find((img) => img.isCover)?.url ||
    data.images?.[0]?.url ||
    null;
  const imagesJson = JSON.stringify(data.images || []);
  const categoriesJson = JSON.stringify(data.categories || []);
  const categoriesZhJson = JSON.stringify(data.categoriesZh || []);
  const highlightsJson = JSON.stringify(data.highlights || []);
  const highlightsZhJson = JSON.stringify(data.highlightsZh || []);
  const includedJson = JSON.stringify(data.included || []);
  const includedZhJson = JSON.stringify(data.includedZh || []);
  const excludedJson = JSON.stringify(data.excluded || []);
  const excludedZhJson = JSON.stringify(data.excludedZh || []);
  const itineraryJson = JSON.stringify(data.itinerary || []);
  const now = new Date().toISOString();

  try {
    await db.execute({
      sql: `INSERT INTO packages (
              id, title, title_zh, slug, description, description_zh, short_description, short_description_zh, price, currency,
              duration, duration_unit, destination, destination_zh, availability, availability_zh, max_participants,
              featured, image_url, images_json, categories_json, categories_zh_json, highlights_json, highlights_zh_json,
              included_json, included_zh_json, excluded_json, excluded_zh_json, itinerary_json,
              status, view_count, inquiry_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.title,
        data.titleZh ?? "",
        slug,
        data.description ?? "",
        data.descriptionZh ?? "",
        data.shortDescription ?? "",
        data.shortDescriptionZh ?? "",
        data.price ?? 0,
        data.currency ?? "IDR",
        data.duration ?? 1,
        data.durationUnit ?? "days",
        data.destination ?? "",
        data.destinationZh ?? "",
        data.availability ?? "",
        data.availabilityZh ?? "",
        data.maxParticipants ?? 1,
        data.featured ? 1 : 0,
        imageUrl,
        imagesJson,
        categoriesJson,
        categoriesZhJson,
        highlightsJson,
        highlightsZhJson,
        includedJson,
        includedZhJson,
        excludedJson,
        excludedZhJson,
        itineraryJson,
        data.status ?? "draft",
        0,
        0,
        now,
        now,
      ],
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: err?.message ?? "Insert failed" },
      500,
    );
  }

  return c.json({ success: true, data: { id, slug } });
});

app.put("/api/packages/:id", async (c) => {
  const driver = resolveDbDriver(c.env);
  if (driver !== "turso") {
    return c.json({ success: false, error: "DB driver is not Turso" }, 503);
  }

  const id = c.req.param("id");
  let body: unknown;
  try {
    body = await c.req.json();
  } catch (err: any) {
    return c.json({ success: false, error: "invalid request body" }, 400);
  }

  let data;
  try {
    data = packageUpdateSchema.parse(body);
  } catch (err: any) {
    return c.json(
      { success: false, error: err?.message ?? "Validation error" },
      400,
    );
  }

  const db = getTursoClient(c.env);
  await ensurePackagesSchema(db);

  const existingRs = await db.execute({
    sql: `SELECT id, title, title_zh as titleZh, slug,
      description, description_zh as descriptionZh,
      short_description as shortDescription, short_description_zh as shortDescriptionZh,
      price, currency,
      duration, duration_unit as durationUnit,
      destination, destination_zh as destinationZh,
      availability, availability_zh as availabilityZh,
      max_participants as maxParticipants,
      featured, view_count as viewCount, inquiry_count as inquiryCount,
      image_url as imageUrl, images_json as imagesJson,
      categories_json as categoriesJson, categories_zh_json as categoriesZhJson,
      highlights_json as highlightsJson, highlights_zh_json as highlightsZhJson,
      included_json as includedJson, included_zh_json as includedZhJson,
      excluded_json as excludedJson, excluded_zh_json as excludedZhJson,
      itinerary_json as itineraryJson,
      status, created_at as createdAt, updated_at as updatedAt
      FROM packages WHERE id = ? LIMIT 1`,
    args: [id],
  });

  if (!existingRs.rows.length) {
    return c.json({ success: false, error: "not found" }, 404);
  }

  const row = existingRs.rows[0] as Record<string, unknown>;
  const current = {
    title: String(row.title ?? ""),
    titleZh: String(row.titleZh ?? ""),
    slug: String(row.slug ?? ""),
    description: String(row.description ?? ""),
    descriptionZh: String(row.descriptionZh ?? ""),
    shortDescription: String(row.shortDescription ?? ""),
    shortDescriptionZh: String(row.shortDescriptionZh ?? ""),
    price: Number(row.price ?? 0),
    currency: String(row.currency ?? "IDR"),
    duration: Number(row.duration ?? 1),
    durationUnit: String(row.durationUnit ?? "days"),
    destination: String(row.destination ?? ""),
    destinationZh: String(row.destinationZh ?? ""),
    availability: String(row.availability ?? ""),
    availabilityZh: String(row.availabilityZh ?? ""),
    maxParticipants: Number(row.maxParticipants ?? 1),
    featured: Boolean(row.featured ?? 0),
    imageUrl: String(row.imageUrl ?? ""),
    images: parseJsonImages(row.imagesJson),
    categories: parseJsonArray(row.categoriesJson),
    categoriesZh: parseJsonArray(row.categoriesZhJson),
    highlights: parseJsonArray(row.highlightsJson),
    highlightsZh: parseJsonArray(row.highlightsZhJson),
    included: parseJsonArray(row.includedJson),
    includedZh: parseJsonArray(row.includedZhJson),
    excluded: parseJsonArray(row.excludedJson),
    excludedZh: parseJsonArray(row.excludedZhJson),
    itinerary: parseJsonList(row.itineraryJson),
    status: String(row.status ?? "draft"),
  };

  const title = data.title ?? current.title;
  const titleZh = data.titleZh ?? current.titleZh;
  const description = data.description ?? current.description;
  const descriptionZh = data.descriptionZh ?? current.descriptionZh;
  const shortDescription = data.shortDescription ?? current.shortDescription;
  const shortDescriptionZh =
    data.shortDescriptionZh ?? current.shortDescriptionZh;
  const price = data.price ?? current.price;
  const currency = data.currency ?? current.currency;
  const duration = data.duration ?? current.duration;
  const durationUnit = data.durationUnit ?? current.durationUnit;
  const destination = data.destination ?? current.destination;
  const destinationZh = data.destinationZh ?? current.destinationZh;
  const availability = data.availability ?? current.availability;
  const availabilityZh = data.availabilityZh ?? current.availabilityZh;
  const maxParticipants = data.maxParticipants ?? current.maxParticipants;
  const featured = data.featured ?? current.featured;
  const images = data.images ?? current.images;
  const imageUrl =
    data.imageUrl ??
    images?.find((img: any) => img.isCover)?.url ??
    images?.[0]?.url ??
    current.imageUrl ??
    null;
  const categories = data.categories ?? current.categories;
  const categoriesZh = data.categoriesZh ?? current.categoriesZh;
  const highlights = data.highlights ?? current.highlights;
  const highlightsZh = data.highlightsZh ?? current.highlightsZh;
  const included = data.included ?? current.included;
  const includedZh = data.includedZh ?? current.includedZh;
  const excluded = data.excluded ?? current.excluded;
  const excludedZh = data.excludedZh ?? current.excludedZh;
  const itinerary = data.itinerary ?? current.itinerary;
  const status = data.status ?? current.status;
  const slug = data.slug?.trim()
    ? data.slug.trim()
    : current.slug || slugify(title);

  const imagesJson = JSON.stringify(images || []);
  const categoriesJson = JSON.stringify(categories || []);
  const categoriesZhJson = JSON.stringify(categoriesZh || []);
  const highlightsJson = JSON.stringify(highlights || []);
  const highlightsZhJson = JSON.stringify(highlightsZh || []);
  const includedJson = JSON.stringify(included || []);
  const includedZhJson = JSON.stringify(includedZh || []);
  const excludedJson = JSON.stringify(excluded || []);
  const excludedZhJson = JSON.stringify(excludedZh || []);
  const itineraryJson = JSON.stringify(itinerary || []);
  const now = new Date().toISOString();

  try {
    await db.execute({
      sql: `UPDATE packages SET
        title = ?, title_zh = ?, slug = ?,
        description = ?, description_zh = ?,
        short_description = ?, short_description_zh = ?,
        price = ?, currency = ?,
        duration = ?, duration_unit = ?,
        destination = ?, destination_zh = ?,
        availability = ?, availability_zh = ?,
        max_participants = ?, featured = ?,
        image_url = ?, images_json = ?,
        categories_json = ?, categories_zh_json = ?,
        highlights_json = ?, highlights_zh_json = ?,
        included_json = ?, included_zh_json = ?,
        excluded_json = ?, excluded_zh_json = ?,
        itinerary_json = ?, status = ?, updated_at = ?
        WHERE id = ?`,
      args: [
        title,
        titleZh,
        slug,
        description,
        descriptionZh,
        shortDescription,
        shortDescriptionZh,
        price,
        currency,
        duration,
        durationUnit,
        destination,
        destinationZh,
        availability,
        availabilityZh,
        maxParticipants,
        featured ? 1 : 0,
        imageUrl,
        imagesJson,
        categoriesJson,
        categoriesZhJson,
        highlightsJson,
        highlightsZhJson,
        includedJson,
        includedZhJson,
        excludedJson,
        excludedZhJson,
        itineraryJson,
        status,
        now,
        id,
      ],
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: err?.message ?? "Update failed" },
      500,
    );
  }

  return c.json({ success: true, data: { id, slug } });
});

app.delete("/api/packages/:id", async (c) => {
  const driver = resolveDbDriver(c.env);
  if (driver !== "turso") {
    return c.json({ success: false, error: "DB driver is not Turso" }, 503);
  }

  const id = c.req.param("id");
  const db = getTursoClient(c.env);
  await ensurePackagesSchema(db);

  try {
    await db.execute({
      sql: "DELETE FROM packages WHERE id = ?",
      args: [id],
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: err?.message ?? "Delete failed" },
      500,
    );
  }

  return c.json({ success: true });
});

app.post("/api/packages/:id/view", async (c) => {
  const driver = resolveDbDriver(c.env);
  if (driver !== "turso") {
    return c.json({ success: false, error: "DB driver is not Turso" }, 503);
  }

  const id = c.req.param("id");
  const db = getTursoClient(c.env);
  await ensurePackagesSchema(db);

  try {
    await db.execute({
      sql: "UPDATE packages SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?",
      args: [id],
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: err?.message ?? "Update failed" },
      500,
    );
  }

  return c.json({ success: true });
});

// List packages (basic pagination)
const mapPackageRow = (row: Record<string, unknown>, lang?: string) => {
  const isZh = lang === "zh";
  const imageUrl = row.imageUrl ? String(row.imageUrl) : "";
  const imagesJson = parseJsonImages(row.imagesJson);
  const images = imagesJson.length
    ? imagesJson
    : imageUrl
      ? [{ id: "", url: imageUrl, alt: "", order: 0, isCover: true }]
      : [];

  const title = String(row.title ?? "");
  const titleZh = String(row.titleZh ?? "");
  const description = String(row.description ?? "");
  const descriptionZh = String(row.descriptionZh ?? "");
  const shortDescription = String(row.shortDescription ?? "");
  const shortDescriptionZh = String(row.shortDescriptionZh ?? "");
  const destination = String(row.destination ?? "");
  const destinationZh = String(row.destinationZh ?? "");
  const availability = String(row.availability ?? "");
  const availabilityZh = String(row.availabilityZh ?? "");

  const categories = parseJsonArray(row.categoriesJson);
  const categoriesZh = parseJsonArray(row.categoriesZhJson);
  const highlights = parseJsonArray(row.highlightsJson);
  const highlightsZh = parseJsonArray(row.highlightsZhJson);
  const included = parseJsonArray(row.includedJson);
  const includedZh = parseJsonArray(row.includedZhJson);
  const excluded = parseJsonArray(row.excludedJson);
  const excludedZh = parseJsonArray(row.excludedZhJson);
  const itinerary = parseJsonList(row.itineraryJson);

  const useText = (enValue: string, zhValue: string) =>
    isZh && zhValue ? zhValue : enValue;
  const useArray = (enValue: string[], zhValue: string[]) =>
    isZh && zhValue.length ? zhValue : enValue;

  return {
    id: String(row.id ?? ""),
    title: useText(title, titleZh),
    slug: String(row.slug ?? ""),
    description: useText(description, descriptionZh),
    shortDescription: useText(shortDescription, shortDescriptionZh),
    price: Number(row.price ?? 0),
    currency: String(row.currency ?? "IDR"),
    destination: useText(destination, destinationZh),
    duration: Number(row.duration ?? 1),
    durationUnit: String(row.durationUnit ?? "days"),
    status: String(row.status ?? "draft"),
    images,
    itinerary,
    categories: useArray(categories, categoriesZh),
    included: useArray(included, includedZh),
    excluded: useArray(excluded, excludedZh),
    highlights: useArray(highlights, highlightsZh),
    availability: useText(availability, availabilityZh),
    maxParticipants: Number(row.maxParticipants ?? 1),
    featured: Boolean(row.featured ?? 0),
    viewCount: Number(row.viewCount ?? 0),
    inquiryCount: Number(row.inquiryCount ?? 0),
    createdAt: String(row.createdAt ?? ""),
    updatedAt: String(row.updatedAt ?? ""),
  };
};

app.get("/api/packages", async (c) => {
  const driver = resolveDbDriver(c.env);
  const limit = Number(c.req.query("limit") ?? 20);
  const offset = Number(c.req.query("offset") ?? 0);
  const status = c.req.query("status");
  const lang = c.req.query("lang");
  const page = Math.max(1, Math.floor(offset / Math.max(limit, 1)) + 1);

  if (driver !== "turso") {
    return c.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  }

  const db = getTursoClient(c.env);
  await ensurePackagesSchema(db);

  try {
    const countRs = await db.execute({
      sql: status
        ? "SELECT COUNT(*) as total FROM packages WHERE status = ?"
        : "SELECT COUNT(*) as total FROM packages",
      args: status ? [status] : [],
    });
    const total = Number(
      (countRs.rows[0] as Record<string, unknown> | undefined)?.total ?? 0,
    );

    const rs = await db.execute({
      sql: status
        ? `SELECT id, title, title_zh as titleZh, slug,
           description, description_zh as descriptionZh,
           short_description as shortDescription, short_description_zh as shortDescriptionZh,
           price, currency,
           duration, duration_unit as durationUnit,
           destination, destination_zh as destinationZh,
           availability, availability_zh as availabilityZh,
           max_participants as maxParticipants,
           featured, view_count as viewCount, inquiry_count as inquiryCount,
           image_url as imageUrl, images_json as imagesJson,
           categories_json as categoriesJson, categories_zh_json as categoriesZhJson,
           highlights_json as highlightsJson, highlights_zh_json as highlightsZhJson,
           included_json as includedJson, included_zh_json as includedZhJson,
           excluded_json as excludedJson, excluded_zh_json as excludedZhJson,
           itinerary_json as itineraryJson,
           status, created_at as createdAt, updated_at as updatedAt
           FROM packages WHERE status = ?
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`
        : `SELECT id, title, title_zh as titleZh, slug,
           description, description_zh as descriptionZh,
           short_description as shortDescription, short_description_zh as shortDescriptionZh,
           price, currency,
           duration, duration_unit as durationUnit,
           destination, destination_zh as destinationZh,
           availability, availability_zh as availabilityZh,
           max_participants as maxParticipants,
           featured, view_count as viewCount, inquiry_count as inquiryCount,
           image_url as imageUrl, images_json as imagesJson,
           categories_json as categoriesJson, categories_zh_json as categoriesZhJson,
           highlights_json as highlightsJson, highlights_zh_json as highlightsZhJson,
           included_json as includedJson, included_zh_json as includedZhJson,
           excluded_json as excludedJson, excluded_zh_json as excludedZhJson,
           itinerary_json as itineraryJson,
           status, created_at as createdAt, updated_at as updatedAt
           FROM packages
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`,
      args: status ? [status, limit, offset] : [limit, offset],
    });
    const mapped = rs.rows.map((row) =>
      mapPackageRow(row as Record<string, unknown>, lang || undefined),
    );
    return c.json({
      success: true,
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: err?.message ?? "Query failed" },
      500,
    );
  }
});

app.get("/api/packages/options", async (c) => {
  const driver = resolveDbDriver(c.env);
  if (driver !== "turso") {
    return c.json({
      success: true,
      data: {
        categories: [],
        destinations: [],
        currencies: ["IDR"],
        availability: [],
      },
    });
  }

  const db = getTursoClient(c.env);
  await ensurePackagesSchema(db);
  let rs;
  try {
    rs = await db.execute(
      "SELECT currency, destination, availability, categories_json FROM packages",
    );
  } catch (err: any) {
    return c.json({ success: false, error: err?.message ?? "DB error" }, 500);
  }

  const currencySet = new Set<string>();
  const destinationSet = new Set<string>();
  const availabilitySet = new Set<string>();
  const categorySet = new Set<string>();

  rs.rows.forEach((row) => {
    const data = row as Record<string, unknown>;
    const currency = String(data.currency ?? "").trim();
    if (currency) currencySet.add(currency);
    const destination = String(data.destination ?? "").trim();
    if (destination) destinationSet.add(destination);
    const availability = String(data.availability ?? "").trim();
    if (availability) availabilitySet.add(availability);
    const categories = parseJsonArray(data.categories_json);
    categories.forEach((cat) => categorySet.add(String(cat)));
  });

  const currencies = Array.from(currencySet);
  const destinations = Array.from(destinationSet);
  const availability = Array.from(availabilitySet);
  const categories = Array.from(categorySet);

  return c.json({
    success: true,
    data: {
      categories,
      destinations,
      currencies: currencies.length ? currencies : ["IDR"],
      availability,
    },
  });
});

app.get("/api/inquiries", async (c) => {
  return c.json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
});

app.get("/api/dashboard/stats", async (c) => {
  return c.json({
    success: true,
    data: {
      totalPackages: 0,
      publishedPackages: 0,
      draftPackages: 0,
      totalInquiries: 0,
      newInquiries: 0,
      convertedInquiries: 0,
      totalViews: 0,
      conversionRate: 0,
    },
  });
});

app.get("/api/packages/:id", async (c) => {
  const driver = resolveDbDriver(c.env);
  if (driver !== "turso")
    return c.json({ success: false, error: "not configured" }, 503);
  const db = getTursoClient(c.env);
  await ensurePackagesSchema(db);

  const id = c.req.param("id");
  const lang = c.req.query("lang");
  const rs = await db.execute({
    sql: `SELECT id, title, title_zh as titleZh, slug,
        description, description_zh as descriptionZh,
        short_description as shortDescription, short_description_zh as shortDescriptionZh,
        price, currency,
        duration, duration_unit as durationUnit,
        destination, destination_zh as destinationZh,
        availability, availability_zh as availabilityZh,
        max_participants as maxParticipants,
        featured, view_count as viewCount, inquiry_count as inquiryCount,
        image_url as imageUrl, images_json as imagesJson,
        categories_json as categoriesJson, categories_zh_json as categoriesZhJson,
        highlights_json as highlightsJson, highlights_zh_json as highlightsZhJson,
        included_json as includedJson, included_zh_json as includedZhJson,
        excluded_json as excludedJson, excluded_zh_json as excludedZhJson,
        itinerary_json as itineraryJson,
        status, created_at as createdAt, updated_at as updatedAt
        FROM packages WHERE id = ? LIMIT 1`,
    args: [id],
  });
  if (!rs.rows.length)
    return c.json({ success: false, error: "not found" }, 404);
  return c.json({
    success: true,
    data: mapPackageRow(
      rs.rows[0] as Record<string, unknown>,
      lang || undefined,
    ),
  });
});

app.get("/api/packages/slug/:slug", async (c) => {
  const driver = resolveDbDriver(c.env);
  if (driver !== "turso")
    return c.json({ success: false, error: "not configured" }, 503);
  const db = getTursoClient(c.env);
  await ensurePackagesSchema(db);

  const slug = c.req.param("slug");
  const lang = c.req.query("lang");
  const rs = await db.execute({
    sql: `SELECT id, title, title_zh as titleZh, slug,
        description, description_zh as descriptionZh,
        short_description as shortDescription, short_description_zh as shortDescriptionZh,
        price, currency,
        duration, duration_unit as durationUnit,
        destination, destination_zh as destinationZh,
        availability, availability_zh as availabilityZh,
        max_participants as maxParticipants,
        featured, view_count as viewCount, inquiry_count as inquiryCount,
        image_url as imageUrl, images_json as imagesJson,
        categories_json as categoriesJson, categories_zh_json as categoriesZhJson,
        highlights_json as highlightsJson, highlights_zh_json as highlightsZhJson,
        included_json as includedJson, included_zh_json as includedZhJson,
        excluded_json as excludedJson, excluded_zh_json as excludedZhJson,
        itinerary_json as itineraryJson,
        status, created_at as createdAt, updated_at as updatedAt
        FROM packages WHERE slug = ? LIMIT 1`,
    args: [slug],
  });
  if (!rs.rows.length)
    return c.json({ success: false, error: "not found" }, 404);
  return c.json({
    success: true,
    data: mapPackageRow(
      rs.rows[0] as Record<string, unknown>,
      lang || undefined,
    ),
  });
});

export default app;
