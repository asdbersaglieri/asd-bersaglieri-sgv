// POST /api/admin/eventi-add — crea un evento (protetto da Cloudflare Access)
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return json({ success: false, message: "Database non disponibile." }, 500);
    const b = await request.json();
    const titolo = (b.titolo || "").toString().trim();
    const data_evento = (b.data_evento || "").toString().trim();
    if (!titolo || !data_evento) {
      return json({ success: false, message: "Titolo e data sono obbligatori." }, 400);
    }
    await env.DB.prepare(
      `INSERT INTO eventi (created_at,titolo,data_evento,ora,luogo,descrizione,pubblicato)
       VALUES (?,?,?,?,?,?,?)`
    ).bind(
      new Date().toISOString(),
      titolo,
      data_evento,
      (b.ora || "").toString().trim(),
      (b.luogo || "").toString().trim(),
      (b.descrizione || "").toString().trim(),
      b.pubblicato === false ? 0 : 1
    ).run();
    return json({ success: true });
  } catch (e) { return json({ success: false, message: "Errore del server." }, 500); }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
