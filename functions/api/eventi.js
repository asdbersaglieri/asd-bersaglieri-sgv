// GET /api/eventi — elenco eventi PUBBLICATI (pubblico, letto da eventi.html)
export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (!env.DB) return json({ items: [] });
    const { results } = await env.DB.prepare(
      "SELECT id,titolo,data_evento,ora,luogo,descrizione FROM eventi WHERE pubblicato = 1 ORDER BY data_evento ASC"
    ).all();
    return json({ items: results || [] });
  } catch (e) { return json({ items: [] }); }
}
function json(o, s = 200) {
  return new Response(JSON.stringify(o), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
