// GET /api/corsi — dettagli pubblici dei 3 corsi
// Letto da corsi.html e dalle pagine corso-*.html.
// Auto-crea la tabella e i 3 corsi fissi alla prima chiamata: nessun SQL manuale.
export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (!env.DB) return json({ items: [] });
    await ensureCorsi(env);
    const { results } = await env.DB.prepare(
      "SELECT slug,titolo,durata,sede,eta_minima,requisiti,quota,video FROM corsi ORDER BY rowid ASC"
    ).all();
    return json({ items: results || [] });
  } catch (e) { return json({ items: [] }); }
}

// Crea la tabella corsi (se manca) e inserisce i 3 corsi fissi (senza sovrascrivere).
async function ensureCorsi(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS corsi (
       slug TEXT PRIMARY KEY,
       titolo TEXT,
       durata TEXT,
       sede TEXT,
       eta_minima TEXT,
       requisiti TEXT,
       quota TEXT,
       video TEXT,
       updated_at TEXT
     )`
  ).run();
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-tiro", "Tiro al bersaglio sportivo"),
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-orientamento", "Orientamento"),
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-sopravvivenza", "Sopravvivenza"),
  ]);
}

function json(o, s = 200) {
  return new Response(JSON.stringify(o), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
