// POST /api/materiali-scarica  (PUBBLICO)
// Consegna il PDF della dispensa di un corso SOLO a chi fornisce la parola
// d'ordine corretta. Non serve mai il PDF senza verifica della parola d'ordine.
//   application/json { slug, password } -> se la password combacia, restituisce il PDF binario
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB || !env.BUCKET) {
      return new Response("Servizio non disponibile.", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
      });
    }

    const validi = ["corso-tiro", "corso-orientamento", "corso-sopravvivenza"];
    const b = await request.json().catch(() => ({}));
    const slug = (b.slug || "").toString().trim();
    if (!validi.includes(slug)) return json({ success: false, message: "Corso non valido." }, 400);

    const password = (b.password || "").toString().trim();
    if (!password) return json({ success: false, message: "Inserisci la parola d'ordine." }, 400);

    const row = await env.DB.prepare(
      "SELECT dispensa, materiali_pwd_hash FROM corsi WHERE slug = ?"
    ).bind(slug).first();
    if (!row || !row.materiali_pwd_hash || !row.dispensa) {
      return json({ success: false, message: "Materiali non disponibili per questo corso." }, 404);
    }

    const hash = await sha256hex(password);
    if (!timingSafeEqualHex(hash, row.materiali_pwd_hash)) {
      return json({ success: false, message: "Parola d'ordine errata." }, 401);
    }

    const obj = await env.BUCKET.get(row.dispensa);
    if (!obj) return json({ success: false, message: "File non trovato." }, 404);

    return new Response(obj.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Dispensa-' + slug + '.pdf"',
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    return json({ success: false, message: "Errore del server." }, 500);
  }
}

function json(o, s = 200) {
  return new Response(JSON.stringify(o), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

// Confronto a tempo costante tra due stringhe esadecimali (evita timing attack).
function timingSafeEqualHex(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
