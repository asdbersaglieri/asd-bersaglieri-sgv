// POST /api/iscrizione  — salva l'iscrizione su D1 e invia l'email
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const form = await request.formData();
    const g = (k) => (form.get(k) || "").toString().trim();

    // Ricontrollo consenso lato server (non aggirabile dal browser)
    if (g("Consenso privacy") !== "Accettato") {
      return json({ success: false, message: "Consenso privacy mancante." }, 400);
    }
    const minore = g("Minorenne") ? "Sì" : "No";
    if (minore === "Sì" && (!g("Genitore/Tutore") || !g("Consenso genitore"))) {
      return json({ success: false, message: "Per i minorenni servono i dati e il consenso del genitore/tutore." }, 400);
    }

    const attivita = ["Corsa","Fitness","Cross Training","Calcetto","Tiro a Bersaglio","Attivita Outdoor","Atletica","Nuoto"]
      .filter((a) => g(a)).join(", ");

    // 1) Salvataggio su D1 (best-effort: non blocca l'email)
    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO iscrizioni
           (created_at,nome,cognome,luogo_nascita,data_nascita,codice_fiscale,nazionalita,indirizzo,cap,comune,cellulare,email,minorenne,genitore,cf_genitore,consenso_genitore,attivita,consenso_privacy)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        ).bind(
          new Date().toISOString(), g("Nome"), g("Cognome"), g("Luogo di nascita"), g("Data di nascita"),
          g("Codice fiscale"), g("Nazionalita"), g("Indirizzo"), g("CAP"), g("Comune di residenza"),
          g("Cellulare"), g("email"), minore, g("Genitore/Tutore"), g("Codice fiscale genitore"),
          (g("Consenso genitore") ? "Sì" : ""), attivita, g("Consenso privacy")
        ).run();
      } catch (e) { /* se D1 non è ancora pronto, prosegue comunque con l'email */ }
    }

    // 2) Email via Web3Forms (notifica all'associazione)
    try {
      const fd = new FormData();
      fd.append("access_key", "88688de5-fafb-4c14-b53d-b8ad19b4dbed");
      fd.append("subject", "Nuova iscrizione — ASD Bersaglieri SGV");
      fd.append("from_name", "Sito ASD Bersaglieri SGV");
      for (const [k, v] of form.entries()) { if (k !== "botcheck" && k !== "access_key") fd.append(k, v); }
      await fetch("https://api.web3forms.com/submit", { method: "POST", body: fd });
    } catch (e) { /* l'iscrizione è comunque salvata su D1 */ }

    return json({ success: true });
  } catch (e) {
    return json({ success: false, message: "Errore del server." }, 500);
  }
}
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } }); }
