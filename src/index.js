const STORAGE_KEY = "subscriptions";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/subscriptions") {
      return handleSubscriptions(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleSubscriptions(request, env) {
  if (!env.DB) return bindingMissing();

  if (request.method === "GET") {
    return getSubscriptions(env.DB);
  }

  if (request.method === "PUT" || request.method === "POST") {
    return saveSubscriptions(request, env.DB);
  }

  return Response.json(
    { error: "Method not allowed" },
    { status: 405, headers: { ...jsonHeaders, Allow: "GET, PUT, POST" } },
  );
}

async function getSubscriptions(db) {
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

async function saveSubscriptions(request, db) {
  let body;
  try {
    body = await request.json();
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
    { error: "D1 binding DB is not configured for this Worker" },
    { status: 503, headers: jsonHeaders },
  );
}
