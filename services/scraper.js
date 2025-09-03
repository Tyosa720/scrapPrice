// ===== services/scraper.js =====
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../database/init');
const discord = require('./discord');
const ml = require('./ml'); // notre module heuristique ML-like

class PriceScraper {
  constructor() {
    this.defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
    };
  }

  async scrapeProduct(productId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [productId], async (err, product) => {
        if (err) return reject(err);
        if (!product) return reject(new Error('Produit non trouvé'));

        db.all('SELECT * FROM product_urls WHERE product_id = ?', [productId], async (err, urls) => {
          if (err) return reject(err);
          if (!urls.length) return;

          const results = [];

          for (const urlData of urls) {
            try {
              console.log(`🔍 Scraping ${urlData.url}...`);
              const result = await this.scrapeUrl(urlData, product);
              results.push(result);
            } catch (error) {
              console.error(`❌ Erreur scraping ${urlData.url}:`, error.message);
              results.push({
                url: urlData.url,
                success: false,
                error: error.message
              });
            }
          }

          resolve(results);
        });
      });
    });
  }

  async scrapeUrl(urlData, product) {
    try {
      const response = await axios.get(urlData.url, { headers: this.defaultHeaders, timeout: 10000 });
      const $ = cheerio.load(response.data);

      // === Utiliser ML heuristique pour extraire nom et prix ===
      const { name: scrapedName, price } = ml.predictProductInfo($);

      if (!price) throw new Error('Prix non trouvé par ML');

      const lastPrice = await this.getLastPrice(urlData.id);
      await this.savePrice(product.id, urlData.id, price, scrapedName);

      const isPromotion = price < lastPrice;
      if (isPromotion) {
        console.log(`🎉 Promo détectée ! ${product.name}: ${lastPrice}€ → ${price}€`);
        await discord.sendPriceAlert(product.name, price, lastPrice, urlData.url);
      }

      return { url: urlData.url, success: true, price, previousPrice: lastPrice, productName: scrapedName, isPromotion };
    } catch (error) {
      throw new Error(`Erreur scraping: ${error.message}`);
    }
  }

  getLastPrice(urlId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT price FROM price_history WHERE url_id = ? ORDER BY scraped_at DESC LIMIT 1',
        [urlId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row ? row.price : null);
        }
      );
    });
  }

  savePrice(productId, urlId, price, productName) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO price_history (product_id, url_id, price, product_name) VALUES (?, ?, ?, ?)',
        [productId, urlId, price, productName],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }
}

module.exports = new PriceScraper();
