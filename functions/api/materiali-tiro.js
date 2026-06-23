// functions/api/materiali-tiro.js
// Materiali del Corso di Tiro al Bersaglio (Fase 1) — RISERVATI ai partecipanti.
//
// Protezione: parola d'ordine condivisa, verificata LATO SERVER contro il segreto
// MATERIALI_TIRO_PWD (Pages > Settings > Variables and Secrets).
// Il contenuto dei moduli (qui sotto, in CONTENT) NON viene mai inviato al
// browser senza una parola d'ordine valida. Niente password nel codice del sito.
//
// Flusso:
//   GET  -> se il cookie "mtiro" e' valido, restituisce {ok:true, html}; altrimenti {ok:false, needPwd:true}
//   POST -> {password}; se corretta, imposta il cookie e restituisce {ok:true, html}; altrimenti {ok:false, message}
// Il cookie conserva l'hash SHA-256 della password (HttpOnly, Secure): non e' falsificabile
// senza conoscere la parola d'ordine, e non e' leggibile via JavaScript.

async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function getCookie(request, name) {
  const c = request.headers.get('Cookie') || '';
  const m = c.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}

function json(obj, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: Object.assign(
      { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      extraHeaders || {}
    )
  });
}

export async function onRequestGet({ request, env }) {
  const pwd = env.MATERIALI_TIRO_PWD;
  if (!pwd) return json({ ok: false, needPwd: true, config: true });
  const token = await sha256hex(pwd);
  if (getCookie(request, 'mtiro') === token) {
    return json({ ok: true, html: CONTENT });
  }
  return json({ ok: false, needPwd: true });
}

export async function onRequestPost({ request, env }) {
  const pwd = env.MATERIALI_TIRO_PWD;
  if (!pwd) {
    return json({ ok: false, config: true, message: "Accesso non ancora configurato. Avvisa l'associazione." });
  }
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const supplied = (body && body.password ? String(body.password) : '').trim();
  if (!supplied) return json({ ok: false, message: "Inserisci la parola d'ordine." });
  if (supplied !== pwd) return json({ ok: false, message: "Parola d'ordine errata." });
  const token = await sha256hex(pwd);
  const cookie = 'mtiro=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000';
  return json({ ok: true, html: CONTENT }, { 'Set-Cookie': cookie });
}

// ===================================================================
//  CONTENUTO DEI 6 MODULI  (consegnato solo dopo la parola d'ordine)
//  Le immagini sono in assets/mat-tiro-*.jpg
// ===================================================================
const CONTENT = `
<div class="m-intro">
  <p>Benvenuto. Questa è l'area riservata ai partecipanti del <b>Corso base di Tiro al Bersaglio &mdash; Fase 1 (didattica d'aula)</b>. Qui trovi i contenuti dei sei moduli e puoi scaricare la dispensa completa in PDF.</p>
  <div class="m-warn">
    <b>Da leggere prima di tutto.</b> Questo è un corso introduttivo e sportivo-amatoriale: <b>non rilascia alcun titolo tecnico e non ha valore legale ai fini del porto d'armi</b>. Lo strumento della giornata è una <b>riproduzione fedele della pistola Beretta 92 a salve</b>, non modificabile: canna ostruita da un inserto metallico e tappo rosso inamovibile. Non incamera né espelle alcun proiettile.
  </div>
</div>

<div class="m-safety">
  <h3>La sicurezza prima di tutto &mdash; le 4 regole d'oro</h3>
  <ol class="m-rules">
    <li><b>Tratta ogni arma come se fosse carica</b> e funzionante &mdash; anche la replica.</li>
    <li><b>Non puntare mai la volata</b> verso ciò che non vuoi colpire.</li>
    <li><b>Tieni il dito fuori dal grilletto</b>, disteso lungo il fusto, finché non sei pronto.</li>
    <li><b>Sii consapevole del bersaglio</b> e di ciò che gli sta intorno e oltre.</li>
  </ol>
  <p class="m-prot"><b>Protezioni obbligatorie</b> (prima di accedere alla linea di tiro): <b>acustiche</b> (cuffie o tappi) e <b>oculari</b> (occhiali). Lo sparo a salve è molto rumoroso e dalla volata escono gas e residui.</p>
</div>

<div class="m-acc">

  <details class="m-mod" open>
    <summary class="m-sum"><span class="m-n">1</span> Di cosa parliamo</summary>
    <div class="m-body">
      <p>Il tiro al bersaglio non ha nulla a che vedere con i miti di forza o velocità: è una disciplina di <b>concentrazione, calma, autocontrollo e stabilità</b>. L'obiettivo non è &laquo;sparare forte&raquo; ma stare fermi, regolare il fiato ed eseguire un gesto geometrico ripetibile in modo costante.</p>
      <p><b>Lo strumento didattico &mdash; replica Beretta 92.</b> Identica a un'arma reale per peso, forme, impugnatura e funzionamento dei comandi: serve ad acquisire la giusta memoria muscolare. La sicurezza è integrata: canna ostruita e tappo rosso inamovibile.</p>
      <p><b>La struttura del corso.</b> <b>Fase 1</b> (oggi): lavoro a vuoto e con la replica a salve &mdash; sicurezza, comandi e i sei fondamentali. <b>Fase 2</b> (in seguito): tiro dal vivo presso un poligono del Tiro a Segno Nazionale (TSN).</p>
    </div>
  </details>

  <details class="m-mod">
    <summary class="m-sum"><span class="m-n">2</span> La sicurezza prima di tutto</summary>
    <div class="m-body">
      <p>La sicurezza non è una nozione da memorizzare: <b>è la disciplina stessa</b>. La precisione è la conseguenza diretta di una mente ordinata.</p>
      <p><b>Il &laquo;riflesso di sussulto&raquo;.</b> Uno stimolo improvviso (un rumore, uno scivolamento) chiude le mani a pugno in una frazione di secondo. Se il dito è sul grilletto, la contrazione fa partire il colpo. L'unico antidoto è tenere l'indice rigido, dritto e sollevato lungo il fusto.</p>
      <figure class="m-fig">
        <img src="assets/mat-tiro-sicurezza.jpg" alt="Le quattro regole d'oro e le protezioni obbligatorie" loading="lazy">
        <figcaption>Le quattro regole d'oro e le protezioni obbligatorie.</figcaption>
      </figure>
      <p><b>La disciplina della linea di tiro.</b> Sulla linea l'autorità dell'istruttore è assoluta e ogni movimento avviene solo a comando. Quando non si spara, l'arma resta scarica sul bancone, senza caricatore e orientata in avanti.</p>
      <table class="m-cmd">
        <thead><tr><th>Comando</th><th>Significato</th><th>Azione del tiratore</th></tr></thead>
        <tbody>
          <tr><td>CESSATE IL FUOCO</td><td>Arresto immediato (emergenza o fine)</td><td>Togliere il dito dal grilletto, arma in avanti, fermarsi.</td></tr>
          <tr><td>ARMA IN SICUREZZA</td><td>Esercizio concluso</td><td>Disattivare e posare l'arma scarica, volata in avanti.</td></tr>
          <tr><td>CARICA / FUOCO</td><td>Autorizzazione a iniziare</td><td>Impugnare; se a salve, inserire il caricatore e camerare; iniziare la sequenza.</td></tr>
        </tbody>
      </table>
    </div>
  </details>

  <details class="m-mod">
    <summary class="m-sum"><span class="m-n">3</span> Conoscere lo strumento</summary>
    <div class="m-body">
      <p>Conoscere la meccanica elimina il timore reverenziale e dà un controllo consapevole: l'arma è una macchina di precisione che risponde a leggi fisiche.</p>
      <figure class="m-fig">
        <img src="assets/mat-tiro-smontaggio.jpg" alt="Anatomia della replica: smontaggio di campagna, tipo Beretta 92" loading="lazy">
        <figcaption>Anatomia della replica (smontaggio di campagna).</figcaption>
      </figure>
      <p><b>Le parti principali.</b></p>
      <ul class="m-list">
        <li><b>Fusto (castello):</b> la struttura portante; ospita impugnatura, vano caricatore, pulsante di sgancio e la catena di scatto.</li>
        <li><b>Carrello-otturatore:</b> la parte superiore mobile; porta percussore, estrattore e gli organi di mira (tacca e mirino).</li>
        <li><b>Canna:</b> ostruita in modo definitivo da un inserto metallico, con tappo rosso inamovibile.</li>
        <li><b>Gruppo di recupero:</b> asta guidamolla e molla, che governano il movimento del carrello.</li>
        <li><b>Caricatore:</b> involucro, elevatore, molla e fondello.</li>
      </ul>
      <p><b>Come funziona il ciclo (a salve).</b> Premendo il grilletto il cane colpisce il percussore; la cartuccia a salve deflagra producendo rumore, vampa e gas. La pressione spinge indietro il carrello (blowback), che espelle il bossolo e riarma il cane, poi ritorna in avanti camerando la cartuccia successiva. <b>Dalla canna ostruita non esce alcun proiettile.</b></p>
    </div>
  </details>

  <details class="m-mod">
    <summary class="m-sum"><span class="m-n">4</span> I fondamentali del tiro</summary>
    <div class="m-body">
      <p>La precisione nasce dall'isolare e ripetere costantemente una sequenza di gesti. Sono <b>sei pilastri</b>: una minima variazione in uno solo cambia il risultato.</p>

      <p><b>1. La posizione (piattaforma isoscele).</b> Piedi alla larghezza delle spalle, piede debole leggermente avanzato; ginocchia morbide, mai bloccate; busto leggermente in avanti per portare il peso sugli avampiedi; braccia distese e simmetriche, a formare un triangolo isoscele.</p>
      <figure class="m-fig">
        <img src="assets/mat-tiro-postura.jpg" alt="La posizione di base" loading="lazy">
        <figcaption>La posizione di base.</figcaption>
      </figure>

      <p><b>2. L'impugnatura (grip cooperativo).</b> Mano forte il più in alto possibile sul dorso, presa salda ma non contratta; mano debole a guscio, che sigilla lo spazio rimasto e avvolge la mano forte; pollici distesi e paralleli verso il bersaglio; indice dritto lungo il fusto fino allo scatto.</p>
      <figure class="m-fig">
        <img src="assets/mat-tiro-impugnatura.jpg" alt="L'impugnatura a due mani" loading="lazy">
        <figcaption>L'impugnatura a due mani.</figcaption>
      </figure>

      <p><b>3. Allineamento e immagine di mira.</b> Mirino centrato nella tacca, stessa altezza e uguale spazio di luce ai due lati. <b>Fuoco nitido sul mirino anteriore</b>; tacca e bersaglio restano volutamente sfocati. L'errore tipico è mettere a fuoco il bersaglio invece del mirino.</p>
      <figure class="m-fig">
        <img src="assets/mat-tiro-mira.jpg" alt="Allineamento e immagine di mira" loading="lazy">
        <figcaption>Allineamento e immagine di mira.</figcaption>
      </figure>

      <p><b>4. La respirazione.</b> Si respira normalmente e si scatta nella pausa naturale dopo l'espirazione, a polmoni fermi. Non trattenere il fiato troppo a lungo, per evitare tremori.</p>
      <p><b>5. Il controllo del grilletto.</b> Il contatto avviene con il centro del polpastrello della prima falange. La pressione è progressiva, costante e rettilinea all'indietro, senza strappi: lo scatto deve cogliere di sorpresa, per prevenire l'anticipazione (flinch).</p>
      <p><b>6. L'accompagnamento (follow-through).</b> Dopo lo scatto mantieni postura e focus sul mirino, con il grilletto premuto per un istante prima di rilasciarlo lentamente. Evita il rilassamento anticipato che devierebbe il colpo.</p>
    </div>
  </details>

  <details class="m-mod">
    <summary class="m-sum"><span class="m-n">5</span> La pratica guidata</summary>
    <div class="m-body">
      <p>In Fase 1 si lavora a vuoto o a salve: non esiste un punteggio e non c'è colpo a segno. L'obiettivo è metabolizzare il gesto, sotto la guida dell'istruttore. Conta la stabilità del gesto, la fluidità dello scatto e la costanza della postura.</p>
      <p><b>Lo storyboard del tiratore.</b></p>
      <ol class="m-list">
        <li><b>Presa.</b> Mano forte alta sul dorso, mano debole a sigillare, indice dritto sul fusto.</li>
        <li><b>Presentazione.</b> Solleva l'arma e distendi le braccia simmetricamente verso la sagoma.</li>
        <li><b>Immagine di mira.</b> Allinea mirino e tacca; fuoco nitido sul mirino.</li>
        <li><b>Respiro.</b> Espira e fermati nella pausa respiratoria naturale.</li>
        <li><b>Scatto.</b> Trazione progressiva e rettilinea: lo sparo deve sorprenderti.</li>
        <li><b>Accompagnamento.</b> Non abbandonare il gesto: mantieni mira e pressione un istante in più.</li>
      </ol>
      <p><b>Gli errori che osserva l'istruttore.</b> Lo <b>strappo (flinch)</b>: contrarre il polso nell'attimo dello scatto, spingendo la volata in basso. L'<b>inversione del focus</b>: guardare il bersaglio invece del mirino. La <b>trazione angolata</b>: una pressione asimmetrica sul grilletto che devia il colpo lateralmente.</p>
    </div>
  </details>

  <details class="m-mod">
    <summary class="m-sum"><span class="m-n">6</span> Come proseguire</summary>
    <div class="m-body">
      <p><b>La transizione alla Fase 2.</b> I fondamentali appresi oggi sono la base di sicurezza per il tiro dal vivo. Al poligono del TSN applicherai esattamente la stessa sequenza (postura, grip, mira, respiro, scatto, accompagnamento) con armi e munizioni reali. Se hai assimilato la presa alta e il busto in avanti, il corpo saprà già assorbire l'energia dello sparo.</p>
      <figure class="m-fig">
        <img src="assets/mat-tiro-rinculo.jpg" alt="La reazione al rinculo in tre fasi" loading="lazy">
        <figcaption>La reazione al rinculo (in Fase 2, dal vivo).</figcaption>
      </figure>
      <p><b>E se volessi il porto d'armi ad uso sportivo?</b> Il corso di oggi non ha alcun valore a questo fine. Il porto d'armi è una licenza dello Stato, con un percorso preciso:</p>
      <ol class="m-list">
        <li><b>Corso e certificazione al TSN:</b> iscrizione a una sezione del Tiro a Segno Nazionale e corso regolamentare con esame teorico-pratico. Al superamento viene rilasciato il <b>DIMA</b> (Diploma di Idoneità al Maneggio delle Armi).</li>
        <li><b>Idoneità sanitaria:</b> certificato anamnestico del medico di base e certificato di idoneità psicofisica rilasciato da ASL o struttura medico-legale militare.</li>
        <li><b>Istanza alla Questura</b> (o Commissariato / Carabinieri) competente. Requisiti: maggiore età e iscrizione a un TSN o società affiliata CONI. La licenza dura cinque anni.</li>
      </ol>
      <p class="m-fineprint">Queste informazioni sono divulgative e non sostituiscono la consulenza degli organi competenti. Costi e prassi variano da provincia a provincia: vanno sempre verificati presso la Questura o i Carabinieri di competenza.</p>
    </div>
  </details>

</div>

<div class="m-dl">
  <a class="btn btn--gold" href="assets/Dispensa-Guida-Corso-Tiro-Partecipanti.pdf" download>Scarica la dispensa completa (PDF)</a>
</div>

<p class="m-note">&copy; A.S.D. Bersaglieri SGV. Tutto il materiale, fotografie e illustrazioni comprese, è di proprietà dell'A.S.D. Bersaglieri SGV. Ne sono vietate la riproduzione e la divulgazione senza previa autorizzazione.</p>
`;
