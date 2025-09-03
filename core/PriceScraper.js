const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../database/init');
const discord = require('../services/discord');
const ExtractorManager = require('../services/extractors/ExtractorManager');
const PriceAnalyzer = require('../analyzers/PriceAnalyzer');
const { Logger } = require('../utils/logger');
const { RetryManager } = require('../utils/retryManager');

class PriceScraper {
  constructor() {
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };
    
    this.extractor = new ExtractorManager();
    this.analyzer = new PriceAnalyzer();
    this.retry = new RetryManager({ maxRetries: 3, delay: 2000 });
    this.logger = new Logger();
  }

  async scrapeProduct(productId) {
    try {
      const product = await this.getProduct(productId);
      const urls = await this.getProductUrls(productId);
      
      if (!urls.length) {
        this.logger.warn(`Aucune URL trouvée pour le produit ${productId}`);
        return [];
      }

      const results = await Promise.allSettled(
        urls.map(url => this.scrapeUrlWithRetry(url, product))
      );

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          this.logger.error(`Erreur scraping ${urls[index].url}:`, result.reason);
          return {
            url: urls[index].url,
            success: false,
            error: result.reason.message
          };
        }
      });
    } catch (error) {
      this.logger.error('Erreur scrapeProduct:', error);
      throw error;
    }
  }

  async scrapeUrlWithRetry(urlData, product) {
    return this.retry.execute(async () => {
      return this.scrapeUrl(urlData, product);
    });
  }

  async scrapeUrl(urlData, product) {
    this.logger.info(`🔍 Scraping ${urlData.url}...`);
    
    try {
      // Faire la requête HTTP
      const response = await this.makeRequest(urlData.url);
      const $ = cheerio.load(response.data);
      
      // Extraire les informations produit
      const productInfo = await this.extractor.extract($, urlData.url);
      
      if (!productInfo?.price) {
        throw new Error('Prix non trouvé sur la page');
      }

      // Analyser les prix et détecter les promotions
      const analyzedInfo = this.analyzer.analyze(productInfo);
      
      // Récupérer le dernier prix enregistré
      const lastPrice = await this.getLastPrice(urlData.id);
      
      // Sauvegarder le nouveau prix
      await this.savePrice(
        product.id,
        urlData.id,
        analyzedInfo.price,
        analyzedInfo.name,
        analyzedInfo.originalPrice,
        analyzedInfo.discountPercent
      );

      // Détecter et notifier les promotions
      const promotionInfo = this.analyzer.detectPromotion(analyzedInfo, lastPrice);
      
      if (promotionInfo.isPromotion) {
        await this.handlePromotion(product, analyzedInfo, urlData.url, promotionInfo, urlData.id);
      }

      return {
        url: urlData.url,
        success: true,
        productName: analyzedInfo.name,
        price: analyzedInfo.price,
        originalPrice: analyzedInfo.originalPrice,
        discountPercent: analyzedInfo.discountPercent,
        previousPrice: lastPrice,
        isPromotion: promotionInfo.isPromotion,
        promotionType: promotionInfo.type,
        confidence: analyzedInfo.confidence
      };

    } catch (error) {
      this.logger.error(`Erreur scraping ${urlData.url}:`, error);
      throw error;
    }
  }

  async makeRequest(url) {
    const config = {
      headers: this.headers,
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: status => status < 400
    };

    // Adapter les headers selon le domaine
    const domain = new URL(url).hostname;
    if (domain.includes('amazon')) {
      config.headers['Accept-Language'] = 'fr-FR,fr;q=0.9';
    }

    return axios.get(url, config);
  }

async handlePromotion(product, productInfo, url, promotionInfo, urlId) {
  try {
    // Récupérer la dernière promo enregistrée pour cette URL
    const lastPromo = await new Promise((resolve, reject) => {
      db.get(
        `SELECT price, discount_percent, promotion_type
         FROM price_history
         WHERE url_id = ?
         ORDER BY scraped_at DESC
         LIMIT 1`,
        [urlId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
    // Vérifier si la promo a changé
    if (
      lastPromo &&
      lastPromo.price === productInfo.price &&
      lastPromo.discount_percent === productInfo.discountPercent
    ) {
      this.logger.info(`Promo identique déjà notifiée pour ${product.name}, pas d’envoi Discord.`);
      return; // Ne rien faire
    }

    // Construire le message
    const message = `🎉 ${promotionInfo.type} détectée ! ${product.name}: `;
    const priceText = productInfo.originalPrice
      ? `${productInfo.originalPrice}€ → ${productInfo.price}€ (-${productInfo.discountPercent}%)`
      : `${productInfo.price}€`;

    this.logger.info(message + priceText);

    // Envoyer la notification Discord
    await discord.sendPriceAlert(
      product.name,
      productInfo.price,
      productInfo.originalPrice,
      url,
      productInfo.discountPercent,
      promotionInfo.type
    );

  } catch (err) {
    this.logger.error(`Erreur lors de l’envoi de la promo pour ${product.name}:`, err);
  }
}

  // Méthodes utilitaires pour la base de données
  async getProduct(productId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
        if (err) return reject(err);
        if (!product) return reject(new Error('Produit non trouvé'));
        resolve(product);
      });
    });
  }

  async getProductUrls(productId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM product_urls WHERE product_id = ?', [productId], (err, urls) => {
        if (err) return reject(err);
        resolve(urls || []);
      });
    });
  }

  async getLastPrice(urlId) {
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

  async savePrice(productId, urlId, price, productName, originalPrice = null, discountPercent = null) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO price_history 
         (product_id, url_id, price, product_name, original_price, discount_percent, scraped_at) 
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [productId, urlId, price, productName, originalPrice, discountPercent],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

    async scrapeUrlInfo(url) {
    if (!url) throw new Error("URL invalide");

    this.logger.info(`🔍 Scraping de l'URL pour auto-complétion: ${url}`);

    try {
        // Faire la requête HTTP
        const response = await this.makeRequest(url);
        const $ = require('cheerio').load(response.data);

        // Extraire les infos produit
        let productInfo = await this.extractor.extract($, url);

        if (!productInfo?.price) {
        throw new Error('Prix non trouvé sur la page');
        }

        // Normaliser et analyser les prix
        productInfo = this.analyzer.analyze(productInfo);

        return {
        success: true,
        url,
        name: productInfo.name,
        description: productInfo.description,
        brand: productInfo.brand,
        price: productInfo.price,
        originalPrice: productInfo.originalPrice,
        discountPercent: productInfo.discountPercent,
        confidence: productInfo.confidence
        };
    } catch (err) {
        this.logger.error(`Erreur scraping ${url}:`, err);
        return {
        success: false,
        url,
        error: err.message
        };
    }
    }
}

module.exports = PriceScraper;