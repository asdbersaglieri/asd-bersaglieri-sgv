// POST /api/admin/corsi-video  (protetto da Cloudflare Access)
//   multipart/form-data { slug, video=file }   -> carica il video su R2 + salva la chiave in corsi.video
//   application/json { action:"delete", slug }  -> elimina il video (da R2 + svuota corsi.video)
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return json({ success: false, message: "Database non disponibile." }, 500);
    await ensureCorsi(env);

    const validi = ["corso-tiro", "corso-orientamento", "corso-sopravvivenza"];
    const ct = (request.headers.get("content-type") || "").toLowerCase();

    // --- ELIMINA (JSON) ---
    if (ct.includes("application/json")) {
      const b = await request.json().catch(() => ({}));
      if (b.action === "delete") {
        const slug = (b.slug || "").toString().trim();
        if (!validi.includes(slug)) return json({ success: false, message: "Corso non valido." }, 400);
        const row = await env.DB.prepare("SELECT video FROM corsi WHERE slug = ?").bind(slug).first();
        if (row && row.video && env.BUCKET) { try { await env.BUCKET.delete(row.video); } catch (e) {} }
        await env.DB.prepare("UPDATE corsi SET video = ?, updated_at = ? WHERE slug = ?")
          .bind("", new Date().toISOString(), slug).run();
        return json({ success: true });
      }
      return json({ success: false, message: "Azione non valida." }, 400);
    }

    // --- CARICA (multipart) ---
    if (!env.BUCKET) return json({ success: false, message: "Archivio non configurato (R2)." }, 500);
    const form = await request.formData();
    const slug = (form.get("slug") || "").toString().trim();
    const file = form.get("video");
    if (!validi.includes(slug)) return json({ success: false, message: "Corso non valido." }, 400);
    if (!file || typeof file !== "object" || typeof file.arrayBuffer !== "function" || file.size === 0) {
      return json({ success: false, message: "File video mancante." }, 400);
    }
    if (file.size > 95 * 1024 * 1024) {
      return json({ success: false, message: "Video troppo grande (max ~95 MB). Comprimilo prima di caricare." }, 400);
    }

    // Chiave stabile per corso: un nuovo upload SOVRASCRIVE il video precedente.
    const key = "video-" + slug + ".mp4";
    await env.BUCKET.put(key, file, { httpMetadata: { contentType: file.type || "video/mp4" } });
    await env.DB.prepare("UPDATE corsi SET video = ?, updated_at = ? WHERE slug = ?")
      .bind(key, new Date().toISOString(), slug).run();

    return json({ success: true, chiave: key });
  } catch (e) {
    return json({ success: false, message: "Errore del server." }, 500);
  }
}

async function ensureCorsi(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS corsi (
       slug TEXT PRIMARY KEY, titolo TEXT, durata TEXT, sede TEXT,
       eta_minima TEXT, requisiti TEXT, quota TEXT, video TEXT, updated_at TEXT
     )`
  ).run();
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-tiro", "Tiro al bersaglio sportivo"),
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-orientamento", "Orientamento"),
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-sopravvivenza", "Sopravvivenza"),
  ]);
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
