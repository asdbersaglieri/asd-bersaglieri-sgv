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
