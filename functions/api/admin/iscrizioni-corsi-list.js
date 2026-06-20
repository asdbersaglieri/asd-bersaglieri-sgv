// GET /api/admin/iscrizioni-corsi-list — tutte le iscrizioni ai corsi (protetto da Cloudflare Access)
export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (!env.DB) return json({ items: [] });
    // Crea la tabella se non esiste ancora (nessuna iscrizione ricevuta): evita errori nel pannello.
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS iscrizioni_corsi (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         created_at TEXT, corso TEXT, nome TEXT, cognome TEXT,
         email TEXT, tel TEXT, consenso_privacy TEXT
       )`
    ).run();
    const { results } = await env.DB.prepare(
      "SELECT * FROM iscrizioni_corsi ORDER BY created_at DESC"
    ).all();
    return json({ items: results || [] });
  } catch (e) { return json({ items: [], error: String(e) }, 500); }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
