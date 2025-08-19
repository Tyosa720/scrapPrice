// scheduler.js
const scraper = require('./services/scraper');
const db = require('./database/init');

const SCRAPE_INTERVAL = 1000 * 60 * 5; // toutes les 5 minutes

async function scrapeAllProducts() {
  try {
    db.all('SELECT id FROM products', async (err, products) => {
      if (err) return console.error(err);

      for (const product of products) {
        await scraper.scrapeProduct(product.id);
      }
    });
  } catch (err) {
    console.error('Erreur lors du scraping automatique:', err);
  }
}

// Fonction exportable pour lancer le scheduler
function startScrapingScheduler() {
  scrapeAllProducts(); // lancer immédiatement
  setInterval(scrapeAllProducts, SCRAPE_INTERVAL);
}

module.exports = { startScrapingScheduler };
