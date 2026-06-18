// POST /api/admin/eventi-delete {id} — elimina un evento (protetto da Cloudflare Access)
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { id } = await request.json();
    if (!env.DB || !id) return json({ success: false }, 400);
    await env.DB.prepare("DELETE FROM eventi WHERE id = ?").bind(id).run();
    return json({ success: true });
  } catch (e) { return json({ success: false }, 500); }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
