// POST /api/admin/iscrizioni-corsi-delete (protetto da Cloudflare Access)
// Body JSON:
//   { id }     -> elimina una singola iscrizione
//   { corso }  -> elimina TUTTE le iscrizioni di quel corso
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return json({ success: false }, 500);
    const b = await request.json().catch(() => ({}));
    if (b.id) {
      await env.DB.prepare("DELETE FROM iscrizioni_corsi WHERE id = ?").bind(Number(b.id)).run();
      return json({ success: true });
    }
    if (typeof b.corso === "string") {
      await env.DB.prepare("DELETE FROM iscrizioni_corsi WHERE corso = ?").bind(b.corso).run();
      return json({ success: true });
    }
    return json({ success: false, message: "Parametro mancante." }, 400);
  } catch (e) { return json({ success: false }, 500); }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
