// POST /api/admin/corsi-dispensa  (protetto da Cloudflare Access)
//   multipart/form-data { slug, dispensa=file }        -> carica il PDF su R2 + salva la chiave in corsi.dispensa
//   application/json { action:"delete-pdf", slug }     -> elimina la dispensa (da R2 + svuota corsi.dispensa)
//   application/json { action:"set-pwd", slug, password } -> salva l'hash della parola d'ordine dei materiali
//   application/json { action:"clear-pwd", slug }      -> rimuove la parola d'ordine (nessun accesso)
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return json({ success: false, message: "Database non disponibile." }, 500);
    await ensureCorsi(env);

    const validi = ["corso-tiro", "corso-orientamento", "corso-sopravvivenza"];
    const ct = (request.headers.get("content-type") || "").toLowerCase();

    if (ct.includes("application/json")) {
      const b = await request.json().catch(() => ({}));
      const slug = (b.slug || "").toString().trim();
      if (!validi.includes(slug)) return json({ success: false, message: "Corso non valido." }, 400);

      if (b.action === "delete-pdf") {
        const row = await env.DB.prepare("SELECT dispensa FROM corsi WHERE slug = ?").bind(slug).first();
        if (row && row.dispensa && env.BUCKET) { try { await env.BUCKET.delete(row.dispensa); } catch (e) {} }
        await env.DB.prepare("UPDATE corsi SET dispensa = ?, updated_at = ? WHERE slug = ?")
          .bind("", new Date().toISOString(), slug).run();
        return json({ success: true });
      }

      if (b.action === "set-pwd") {
        const password = (b.password || "").toString().trim();
        if (!password) return json({ success: false, message: "Parola d'ordine mancante." }, 400);
        const hash = await sha256hex(password);
        await env.DB.prepare("UPDATE corsi SET materiali_pwd_hash = ?, updated_at = ? WHERE slug = ?")
          .bind(hash, new Date().toISOString(), slug).run();
        return json({ success: true });
      }

      if (b.action === "clear-pwd") {
        await env.DB.prepare("UPDATE corsi SET materiali_pwd_hash = ?, updated_at = ? WHERE slug = ?")
          .bind("", new Date().toISOString(), slug).run();
        return json({ success: true });
      }

      return json({ success: false, message: "Azione non valida." }, 400);
    }

    if (!env.BUCKET) return json({ success: false, message: "Archivio non configurato (R2)." }, 500);
    const form = await request.formData();
    const slug = (form.get("slug") || "").toString().trim();
    const file = form.get("dispensa");
    if (!validi.includes(slug)) return json({ success: false, message: "Corso non valido." }, 400);
    if (!file || typeof file !== "object" || typeof file.arrayBuffer !== "function" || file.size === 0) {
      return json({ success: false, message: "File della dispensa mancante." }, 400);
    }
    const nome = (file.name || "").toString().toLowerCase();
    if (file.type !== "application/pdf" && !nome.endsWith(".pdf")) {
      return json({ success: false, message: "La dispensa deve essere un file PDF." }, 400);
    }
    if (file.size > 25 * 1024 * 1024) {
      return json({ success: false, message: "Dispensa troppo grande (max 25 MB). Riducila prima di caricare." }, 400);
    }

    const key = "dispensa-" + slug + ".pdf";
    await env.BUCKET.put(key, file, { httpMetadata: { contentType: "application/pdf" } });
    await env.DB.prepare("UPDATE corsi SET dispensa = ?, updated_at = ? WHERE slug = ?")
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
  try { await env.DB.prepare("ALTER TABLE corsi ADD COLUMN dispensa TEXT").run(); } catch (e) {}
  try { await env.DB.prepare("ALTER TABLE corsi ADD COLUMN materiali_pwd_hash TEXT").run(); } catch (e) {}
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-tiro", "Tiro al bersaglio sportivo"),
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-orientamento", "Orientamento"),
    env.DB.prepare("INSERT OR IGNORE INTO corsi (slug,titolo) VALUES (?,?)").bind("corso-sopravvivenza", "Sopravvivenza"),
  ]);
}
async function sha256hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
