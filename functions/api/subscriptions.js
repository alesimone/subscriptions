const STORAGE_KEY = "subscriptions";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export async function onRequestGet(context) {
  const db = context.env.DB;
  if (!db) return bindingMissing();

  await ensureSchema(db);
  const row = await db
    .prepare("SELECT value, updated_at FROM app_state WHERE key = ?")
    .bind(STORAGE_KEY)
    .first();

  return Response.json(
    {
      subscriptions: row?.value ? JSON.parse(row.value) : [],
      updatedAt: row?.updated_at || null,
    },
    { headers: jsonHeaders },
  );
}

export async function onRequestPut(context) {
  return saveSubscriptions(context);
}

export async function onRequestPost(context) {
  return saveSubscriptions(context);
}

async function saveSubscriptions(context) {
  const db = context.env.DB;
  if (!db) return bindingMissing();

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: jsonHeaders });
  }

  const subscriptions = Array.isArray(body) ? body : body.subscriptions;
  if (!Array.isArray(subscriptions)) {
    return Response.json({ error: "Expected a subscriptions array" }, { status: 400, headers: jsonHeaders });
  }

  const updatedAt = new Date().toISOString();
  await ensureSchema(db);
  await db
    .prepare(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(STORAGE_KEY, JSON.stringify(subscriptions), updatedAt)
    .run();

  return Response.json({ ok: true, updatedAt }, { headers: jsonHeaders });
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    )
    .run();
}

function bindingMissing() {
  return Response.json(
    { error: "D1 binding DB is not configured for this Pages project" },
    { status: 503, headers: jsonHeaders },
  );
}
