-- Tabella iscrizioni (già in uso)
CREATE TABLE IF NOT EXISTS iscrizioni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,
  nome TEXT, cognome TEXT,
  luogo_nascita TEXT, data_nascita TEXT,
  codice_fiscale TEXT, nazionalita TEXT,
  indirizzo TEXT, cap TEXT, comune TEXT,
  cellulare TEXT, email TEXT,
  minorenne TEXT, genitore TEXT, cf_genitore TEXT, consenso_genitore TEXT,
  attivita TEXT, consenso_privacy TEXT
);

-- Tabella eventi (gestita dal pannello area riservata)
CREATE TABLE IF NOT EXISTS eventi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,
  titolo TEXT,
  data_evento TEXT,      -- formato AAAA-MM-GG
  ora TEXT,              -- opzionale, es. "09:30"
  luogo TEXT,
  descrizione TEXT,
  pubblicato INTEGER DEFAULT 1,  -- 1 = visibile sul sito, 0 = bozza
  locandina TEXT         -- chiave del file immagine su R2 (opzionale)
);

-- Tabella adesioni agli eventi (registrata dal sito pubblico)
CREATE TABLE IF NOT EXISTS adesioni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,       -- data e ora dell'adesione
  evento_id INTEGER,     -- id dell'evento (collega a eventi.id)
  titolo_evento TEXT,    -- titolo copiato, per comodità
  nome TEXT,             -- facoltativo
  cognome TEXT,          -- facoltativo
  contatto TEXT,         -- facoltativo (telefono o email)
  consenso TEXT          -- "Accettato" se ha lasciato dati
);

-- Galleria: album e foto (gestiti dal pannello, immagini su R2)
CREATE TABLE IF NOT EXISTS album (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,
  nome TEXT,
  copertina TEXT
);
CREATE TABLE IF NOT EXISTS foto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,
  album_id INTEGER,
  chiave TEXT
);
