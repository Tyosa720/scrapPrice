const { normalizePrice, calculateDiscount } = require('../utils/PriceUtils');

class PriceAnalyzer {
  analyze(productInfo) {
    const result = { ...productInfo };

    // Normaliser les prix
    result.price = normalizePrice(result.price);
    result.originalPrice = normalizePrice(result.originalPrice);

    // Calcul du pourcentage de réduction
    result.discountPercent = calculateDiscount(result.price, result.originalPrice);

    // Validation des prix incohérents
    if (result.originalPrice && result.price && result.originalPrice < result.price) {
      [result.price, result.originalPrice] = [result.originalPrice, result.price];
      result.discountPercent = calculateDiscount(result.price, result.originalPrice);
    }

    // Si la différence est trop faible (<5%), ignorer le prix barré
    if (result.discountPercent !== null && result.discountPercent < 5) {
      result.originalPrice = null;
      result.discountPercent = null;
    }

    // Calcul de confiance
    result.confidence = this.calculateConfidence(result);

    return result;
  }

  calculateConfidence(productInfo) {
    let confidence = productInfo.confidence || 0.5;

    if (productInfo.name && productInfo.name.length > 5) confidence += 0.1;
    if (productInfo.price && productInfo.originalPrice && productInfo.originalPrice > productInfo.price) confidence += 0.1;
    if (productInfo.price && (productInfo.price < 0.01 || productInfo.price > 100000)) confidence -= 0.3;

    return Math.min(Math.max(confidence, 0), 1);
  }

  detectPromotion(productInfo, lastPrice) {
    const promo = { isPromotion: false, type: null, reason: null };

    if (productInfo.originalPrice && productInfo.price < productInfo.originalPrice) {
      promo.isPromotion = true;
      promo.type = 'Prix barré';
      promo.reason = `Réduction de ${productInfo.discountPercent}%`;
    } else if (lastPrice && productInfo.price < lastPrice * 0.9) {
      const reduction = Math.round(((lastPrice - productInfo.price) / lastPrice) * 100);
      promo.isPromotion = true;
      promo.type = 'Baisse de prix';
      promo.reason = `Prix passé de ${lastPrice}€ à ${productInfo.price}€ (-${reduction}%)`;
    }

    return promo;
  }
  async getLastPromotion(urlId) {
    return new Promise((resolve, reject) => {
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
  }
}

module.exports = PriceAnalyzer;