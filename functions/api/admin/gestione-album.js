// POST /api/admin/gestione-album  (protetto da Access)
// Body JSON:
//   { action:"add", nome }            -> crea album
//   { action:"delete", id }           -> elimina album + tutte le sue foto (anche da R2)
//   { action:"cover", id, chiave }    -> imposta la copertina dell'album
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return json({ success: false }, 500);
    const b = await request.json().catch(() => ({}));

    if (b.action === "add") {
      const nome = (b.nome || "").toString().trim();
      if (!nome) return json({ success: false, message: "Il nome dell'album è obbligatorio." }, 400);
      const r = await env.DB.prepare("INSERT INTO album (created_at,nome,copertina) VALUES (?,?,?)")
        .bind(new Date().toISOString(), nome, "").run();
      return json({ success: true, id: r.meta && r.meta.last_row_id });
    }

    if (b.action === "delete") {
      const id = Number(b.id);
      if (!id) return json({ success: false }, 400);
      // elimino i file da R2
      try {
        const { results } = await env.DB.prepare("SELECT chiave FROM foto WHERE album_id = ?").bind(id).all();
        if (env.BUCKET && results) {
          for (const f of results) { if (f.chiave) { try { await env.BUCKET.delete(f.chiave); } catch (e) {} } }
        }
      } catch (e) {}
      await env.DB.prepare("DELETE FROM foto WHERE album_id = ?").bind(id).run();
      await env.DB.prepare("DELETE FROM album WHERE id = ?").bind(id).run();
      return json({ success: true });
    }

    if (b.action === "cover") {
      const id = Number(b.id);
      const chiave = (b.chiave || "").toString();
      if (!id) return json({ success: false }, 400);
      await env.DB.prepare("UPDATE album SET copertina = ? WHERE id = ?").bind(chiave, id).run();
      return json({ success: true });
    }

    return json({ success: false, message: "Azione non valida." }, 400);
  } catch (e) { return json({ success: false, message: "Errore del server." }, 500); }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
