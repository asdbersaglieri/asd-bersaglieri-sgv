// POST /api/admin/gestione-foto  (protetto da Access)
//   multipart/form-data { album_id, foto=file }  -> carica una foto su R2 + DB
//   application/json { action:"delete", id }      -> elimina una foto (anche da R2)
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return json({ success: false }, 500);
    const ct = (request.headers.get("content-type") || "").toLowerCase();

    // --- ELIMINA (JSON) ---
    if (ct.includes("application/json")) {
      const b = await request.json().catch(() => ({}));
      if (b.action === "delete") {
        const id = Number(b.id);
        if (!id) return json({ success: false }, 400);
        const row = await env.DB.prepare("SELECT album_id,chiave FROM foto WHERE id = ?").bind(id).first();
        await env.DB.prepare("DELETE FROM foto WHERE id = ?").bind(id).run();
        if (row && row.chiave && env.BUCKET) { try { await env.BUCKET.delete(row.chiave); } catch (e) {} }
        // se era la copertina, ne scelgo un'altra (o vuoto)
        if (row && row.album_id) {
          const alb = await env.DB.prepare("SELECT copertina FROM album WHERE id = ?").bind(row.album_id).first();
          if (alb && alb.copertina === row.chiave) {
            const next = await env.DB.prepare("SELECT chiave FROM foto WHERE album_id = ? ORDER BY id ASC LIMIT 1").bind(row.album_id).first();
            await env.DB.prepare("UPDATE album SET copertina = ? WHERE id = ?").bind(next ? next.chiave : "", row.album_id).run();
          }
        }
        return json({ success: true });
      }
      return json({ success: false, message: "Azione non valida." }, 400);
    }

    // --- CARICA (multipart) ---
    if (!env.BUCKET) return json({ success: false, message: "Archivio immagini non configurato." }, 500);
    const form = await request.formData();
    const album_id = Number(form.get("album_id"));
    const file = form.get("foto");
    if (!album_id || !file || typeof file.arrayBuffer !== "function" || file.size === 0) {
      return json({ success: false, message: "Dati mancanti." }, 400);
    }
    if (file.size > 12 * 1024 * 1024) {
      return json({ success: false, message: "File troppo grande." }, 400);
    }
    const rnd = Math.random().toString(36).slice(2, 8);
    const chiave = "foto-" + Date.now() + "-" + rnd + ".jpg";
    const buf = await file.arrayBuffer();
    await env.BUCKET.put(chiave, buf, { httpMetadata: { contentType: file.type || "image/jpeg" } });
    await env.DB.prepare("INSERT INTO foto (created_at,album_id,chiave) VALUES (?,?,?)")
      .bind(new Date().toISOString(), album_id, chiave).run();
    // se l'album non ha copertina, questa diventa la copertina
    const alb = await env.DB.prepare("SELECT copertina FROM album WHERE id = ?").bind(album_id).first();
    if (alb && (!alb.copertina || alb.copertina === "")) {
      await env.DB.prepare("UPDATE album SET copertina = ? WHERE id = ?").bind(chiave, album_id).run();
    }
    return json({ success: true, chiave: chiave });
  } catch (e) { return json({ success: false, message: "Errore del server." }, 500); }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
