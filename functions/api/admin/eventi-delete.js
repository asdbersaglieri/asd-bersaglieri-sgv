// POST /api/admin/eventi-delete {id} — elimina un evento e la sua locandina (protetto da Access)
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { id } = await request.json();
    if (!env.DB || !id) return json({ success: false }, 400);

    // Recupero la chiave della locandina prima di cancellare la riga
    let key = "";
    try {
      const { results } = await env.DB.prepare("SELECT locandina FROM eventi WHERE id = ?").bind(id).all();
      if (results && results[0]) key = results[0].locandina || "";
    } catch (e) { /* colonna assente o errore: ignoro */ }

    await env.DB.prepare("DELETE FROM eventi WHERE id = ?").bind(id).run();

    // Elimino anche il file da R2, se presente
    if (key && env.BUCKET) { try { await env.BUCKET.delete(key); } catch (e) {} }

    return json({ success: true });
  } catch (e) { return json({ success: false }, 500); }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
