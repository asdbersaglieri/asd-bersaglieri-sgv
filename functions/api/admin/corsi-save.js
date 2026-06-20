// POST /api/admin/corsi-save — aggiorna i dettagli di UN corso (protetto da Cloudflare Access)
// Body JSON: { slug, durata, sede, eta_minima, requisiti, quota }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return json({ success: false, message: "Database non disponibile." }, 500);
    await ensureCorsi(env);

    const b = await request.json().catch(() => ({}));
    const slug = (b.slug || "").toString().trim();
    const validi = ["corso-tiro", "corso-orientamento", "corso-sopravvivenza"];
    if (!validi.includes(slug)) {
      return json({ success: false, message: "Corso non valido." }, 400);
    }
    const g = (k) => (b[k] == null ? "" : String(b[k])).trim();

    await env.DB.prepare(
      `UPDATE corsi SET durata=?, sede=?, eta_minima=?, requisiti=?, quota=?, updated_at=? WHERE slug=?`
    ).bind(g("durata"), g("sede"), g("eta_minima"), g("requisiti"), g("quota"), new Date().toISOString(), slug).run();

    return json({ success: true });
  } catch (e) {
    return json({ success: false, message: "Errore del server." }, 500);
  }
}

async function ensureCorsi(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS corsi (
       slug TEXT PRIMARY KEY, titolo TEXT, durata TEXT, sede TEXT,
       eta_minima TEXT, requisiti TEXT, quota TEXT, video TEXT, updated_at TEXT
     )`
  ).run();
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-tiro", "Tiro al bersaglio sportivo"),
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-orientamento", "Orientamento"),
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-sopravvivenza", "Sopravvivenza"),
  ]);
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
