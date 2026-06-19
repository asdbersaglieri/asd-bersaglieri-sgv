// POST /api/admin/adesioni-delete (protetto da Access)
// Body JSON:
//   { id }            -> elimina una singola adesione
//   { titolo }        -> elimina TUTTE le adesioni con quel titolo_evento
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return json({ success: false }, 500);
    const b = await request.json().catch(() => ({}));
    if (b.id) {
      await env.DB.prepare("DELETE FROM adesioni WHERE id = ?").bind(Number(b.id)).run();
      return json({ success: true });
    }
    if (typeof b.titolo === "string") {
      await env.DB.prepare("DELETE FROM adesioni WHERE titolo_evento = ?").bind(b.titolo).run();
      return json({ success: true });
    }
    return json({ success: false, message: "Parametro mancante." }, 400);
  } catch (e) { return json({ success: false }, 500); }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
