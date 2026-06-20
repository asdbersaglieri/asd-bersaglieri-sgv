// POST /api/iscrizione-corso — registra l'iscrizione a un corso nel database (pubblico)
// Body JSON: { corso, nome, cognome, email, tel, consenso }
// L'email di notifica viene inviata dal BROWSER (Web3Forms), non qui (vedi §5 dello stato progetto).
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const b = await request.json().catch(() => ({}));
    const corso = (b.corso || "").toString().trim();
    const nome = (b.nome || "").toString().trim();
    const cognome = (b.cognome || "").toString().trim();
    const email = (b.email || "").toString().trim();
    const tel = (b.tel || "").toString().trim();
    const consenso = b.consenso === true || b.consenso === "Accettato" ? "Accettato" : "";

    // Validazione (stessa logica del modulo pubblico)
    if (!nome || !cognome) {
      return json({ success: false, message: "Nome e cognome sono obbligatori." }, 400);
    }
    if (!email && !tel) {
      return json({ success: false, message: "Indica almeno un contatto (email o telefono)." }, 400);
    }
    if (consenso !== "Accettato") {
      return json({ success: false, message: "Per iscriverti serve il consenso privacy." }, 400);
    }

    if (env.DB) {
      try {
        await env.DB.prepare(
          `CREATE TABLE IF NOT EXISTS iscrizioni_corsi (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             created_at TEXT, corso TEXT, nome TEXT, cognome TEXT,
             email TEXT, tel TEXT, consenso_privacy TEXT
           )`
        ).run();
        await env.DB.prepare(
          `INSERT INTO iscrizioni_corsi (created_at,corso,nome,cognome,email,tel,consenso_privacy)
           VALUES (?,?,?,?,?,?,?)`
        ).bind(new Date().toISOString(), corso, nome, cognome, email, tel, consenso).run();
      } catch (e) { /* prosegue comunque: l'email di avviso è già partita dal browser */ }
    }

    return json({ success: true });
  } catch (e) {
    return json({ success: false, message: "Errore del server." }, 500);
  }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
