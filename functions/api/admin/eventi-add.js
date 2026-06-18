// POST /api/admin/eventi-add — crea un evento, con locandina opzionale (protetto da Access)
// Riceve multipart/form-data: titolo, data_evento, ora, luogo, descrizione, pubblicato, [locandina=file]
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return json({ success: false, message: "Database non disponibile." }, 500);

    const form = await request.formData();
    const titolo = (form.get("titolo") || "").toString().trim();
    const data_evento = (form.get("data_evento") || "").toString().trim();
    if (!titolo || !data_evento) {
      return json({ success: false, message: "Titolo e data sono obbligatori." }, 400);
    }

    // Locandina opzionale
    let locandinaKey = "";
    const file = form.get("locandina");
    if (file && typeof file === "object" && typeof file.arrayBuffer === "function" && file.size > 0) {
      if (!env.BUCKET) {
        return json({ success: false, message: "Archivio immagini non ancora configurato (R2)." }, 500);
      }
      if (file.size > 10 * 1024 * 1024) {
        return json({ success: false, message: "La locandina è troppo grande (massimo 10 MB)." }, 400);
      }
      const tipo = (file.type || "").toLowerCase();
      const estensioni = { "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
      const ext = estensioni[tipo] || ".jpg";
      const rnd = Math.random().toString(36).slice(2, 8);
      locandinaKey = "loc-" + Date.now() + "-" + rnd + ext;
      const buf = await file.arrayBuffer();
      await env.BUCKET.put(locandinaKey, buf, { httpMetadata: { contentType: tipo || "image/jpeg" } });
    }

    await env.DB.prepare(
      `INSERT INTO eventi (created_at,titolo,data_evento,ora,luogo,descrizione,pubblicato,locandina)
       VALUES (?,?,?,?,?,?,?,?)`
    ).bind(
      new Date().toISOString(),
      titolo,
      data_evento,
      (form.get("ora") || "").toString().trim(),
      (form.get("luogo") || "").toString().trim(),
      (form.get("descrizione") || "").toString().trim(),
      form.get("pubblicato") === "0" ? 0 : 1,
      locandinaKey
    ).run();

    return json({ success: true });
  } catch (e) {
    return json({ success: false, message: "Errore del server." }, 500);
  }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
