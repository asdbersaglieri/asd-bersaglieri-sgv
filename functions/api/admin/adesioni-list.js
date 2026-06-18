// GET /api/admin/adesioni-list — tutte le adesioni (protetto da Access)
export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (!env.DB) return json({ items: [] });
    const { results } = await env.DB.prepare(
      "SELECT * FROM adesioni ORDER BY created_at DESC"
    ).all();
    return json({ items: results || [] });
  } catch (e) { return json({ items: [], error: String(e) }, 500); }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
