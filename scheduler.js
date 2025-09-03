const PriceScraper = require('./core/PriceScraper');
const db = require('./database/init');
const { Logger } = require('./utils/logger');

const SCRAPE_INTERVAL = 1000 * 60 * 5;
const logger = new Logger();

const scraper = new PriceScraper();

async function scrapeAllProducts() {
  try {
    const products = await getAllProducts();

    if (!products.length) {
      logger.warn('Aucun produit trouvé pour le scraping.');
      return;
    }

    // Scraper les produits **en parallèle mais limiter le nombre de requêtes simultanées**
    // Ici Promise.allSettled pour ne pas interrompre le scraping si un produit échoue
    const results = await Promise.allSettled(
      products.map(product => scraper.scrapeProduct(product.id))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        logger.info(`✅ Scraping terminé pour le produit ${products[index].id}`);
      } else {
        logger.error(`❌ Erreur lors du scraping du produit ${products[index].id}:`, result.reason);
      }
    });
  } catch (err) {
    logger.error('Erreur lors du scraping automatique:', err);
  }
}

// Fonction utilitaire pour récupérer tous les produits
function getAllProducts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id FROM products', (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// Fonction pour démarrer le scheduler
function startScrapingScheduler() {
  scrapeAllProducts(); // Lancer immédiatement
  setInterval(scrapeAllProducts, SCRAPE_INTERVAL);
}

module.exports = { startScrapingScheduler };