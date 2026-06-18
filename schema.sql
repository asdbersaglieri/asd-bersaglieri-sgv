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
  pubblicato INTEGER DEFAULT 1   -- 1 = visibile sul sito, 0 = bozza
);
