// POST /api/adesione — registra un'adesione a un evento (pubblico)
// Body JSON: { evento_id, titolo, nome, cognome, contatto, consenso }
// Campi nome/cognome/contatto FACOLTATIVI. Se vuoti => adesione anonima.
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

    // Consenso privacy obbligatorio SOLO se l'utente ha lasciato qualche dato
    const consenso = b.consenso === true || b.consenso === "Accettato" ? "Accettato" : "";
    if (haDati && consenso !== "Accettato") {
      return json({ success: false, message: "Per inviare i tuoi dati serve il consenso privacy." }, 400);
    }

    // 1) Salvataggio su D1 (best-effort)
    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO adesioni (created_at,evento_id,titolo_evento,nome,cognome,contatto,consenso)
           VALUES (?,?,?,?,?,?,?)`
        ).bind(new Date().toISOString(), evento_id, titolo, nome, cognome, contatto, consenso).run();
      } catch (e) { /* prosegue comunque con l'email */ }
    }

    // 2) Email via Web3Forms (notifica all'associazione)
    try {
      const fd = new FormData();
      fd.append("access_key", "88688de5-fafb-4c14-b53d-b8ad19b4dbed");
      fd.append("subject", "Adesione evento: " + (titolo || "(senza titolo)"));
      fd.append("from_name", "Sito ASD Bersaglieri SGV");
      fd.append("Evento", titolo || "");
      if (haDati) {
        fd.append("Nome", nome || "(non indicato)");
        fd.append("Cognome", cognome || "(non indicato)");
        fd.append("Contatto", contatto || "(non indicato)");
        fd.append("Consenso privacy", consenso);
      } else {
        fd.append("Adesione", "ANONIMA (nessun dato lasciato)");
      }
      await fetch("https://api.web3forms.com/submit", { method: "POST", body: fd });
    } catch (e) { /* l'adesione è comunque salvata su D1 */ }

    return json({ success: true });
  } catch (e) {
    return json({ success: false, message: "Errore del server." }, 500);
  }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
