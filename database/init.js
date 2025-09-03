// ===== database/init.js =====
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Créer le dossier database s'il n'existe pas
const dbDir = path.dirname(__filename);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(__dirname, 'products.db');
const db = new sqlite3.Database(dbPath);

// Initialisation des tables
db.serialize(() => {
  // Table des produits
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des URLs de produits
  db.run(`
    CREATE TABLE IF NOT EXISTS product_urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  // Table de l'historique des prix
  db.run(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      url_id INTEGER,
      price REAL NOT NULL,
      original_price REAL,
      discount_percent INTEGER,
      currency TEXT,
      is_promo INTEGER DEFAULT 0,
      promotion_type TEXT,
      product_name TEXT,
      scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (url_id) REFERENCES product_urls (id)
    )
  `);

  console.log('✅ Base de données initialisée avec succès');
});

module.exports = db;