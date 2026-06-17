# Sito ASD Bersaglieri SGV

Sito statico (Cloudflare Pages) con modulo iscrizioni che salva su database D1
e invia notifica email, e area riservata protetta.

## Struttura
- Pagine: index, home, eventi, galleria, iscrizioni, pagamento, privacy, area
- assets/ : immagini
- functions/api/iscrizione.js : riceve il modulo, salva su D1, invia email
- functions/api/admin/list.js : elenco iscrizioni (proteggere con Access)
- functions/api/admin/delete.js : elimina iscrizione (proteggere con Access)
- schema.sql : tabella del database

## Configurazione su Cloudflare (riassunto)
1. Creare un database D1 ed eseguire schema.sql.
2. In Pages → Settings → Bindings: aggiungere D1 con Variable name = DB.
3. Collegare questo repo GitHub a un progetto Cloudflare Pages
   (Framework preset: None — Build command: vuoto — Output: /).
4. In Cloudflare Zero Trust → Access: proteggere /area.html e /api/admin/*
   con policy che consente solo anb.asd.sgv@gmail.com.
