// POST /api/adesione — registra un'adesione a un evento nel database (pubblico)
// Body JSON: { evento_id, titolo, nome, cognome, contatto, consenso }
// L'email di notifica viene inviata dal BROWSER (lato client), non qui.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const b = await request.json().catch(() => ({}));
    const nome = (b.nome || "").toString().trim();
    const cognome = (b.cognome || "").toString().trim();
    const contatto = (b.contatto || "").toString().trim();
    const titolo = (b.titolo || "").toString().trim();
    const evento_id = b.evento_id ? Number(b.evento_id) : null;
    const haDati = !!(nome || cognome || contatto);

    const consenso = b.consenso === true || b.consenso === "Accettato" ? "Accettato" : "";
    if (haDati && consenso !== "Accettato") {
      return json({ success: false, message: "Per inviare i tuoi dati serve il consenso privacy." }, 400);
    }

    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO adesioni (created_at,evento_id,titolo_evento,nome,cognome,contatto,consenso)
           VALUES (?,?,?,?,?,?,?)`
        ).bind(new Date().toISOString(), evento_id, titolo, nome, cognome, contatto, consenso).run();
      } catch (e) { /* prosegue comunque */ }
    }

    return json({ success: true });
  } catch (e) {
    return json({ success: false, message: "Errore del server." }, 500);
  }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
