class HtmlHeuristicExtractor {
  extract($, domain) {
    const selectors = this.getDomainSelectors(domain);
    let bestResult = null;
    let maxConfidence = 0;

    // Essayer les sélecteurs spécifiques au domaine d'abord
    for (const selector of selectors) {
      const result = this.trySelector($, selector);
      if (result && result.confidence > maxConfidence) {
        maxConfidence = result.confidence;
        bestResult = result;
      }
    }

    // Essayer les sélecteurs génériques
    if (!bestResult) {
      const genericResult = this.extractGeneric($);
      if (genericResult) {
        bestResult = { ...genericResult, confidence: 0.4 };
      }
    }

    return bestResult;
  }

  getDomainSelectors(domain) {
    const domainSelectors = {
      'amazon.fr': [
        { price: '.a-price-current .a-price-integer', original: '.a-text-strike .a-price-integer', confidence: 0.9 },
        { price: '#apex_desktop .a-price .a-price-current', original: '.a-text-strike', confidence: 0.8 }
      ],
      'cdiscount.com': [
        { price: '.fpPrice', original: '.fpStriked', confidence: 0.9 }
      ],
      'fnac.com': [
        { price: '.userPrice', original: '.oldUserPrice', confidence: 0.9 }
      ],
      'leclerc.fr': [
        { price: '.price', original: '.price-before', confidence: 0.8 }
      ]
    };

    return domainSelectors[domain] || [];
  }

  trySelector($, selector) {
    const priceEl = $(selector.price).first();
    if (priceEl.length === 0) return null;

    const price = this.parsePrice(priceEl.text());
    if (!price) return null;

    let originalPrice = null;
    if (selector.original) {
      const originalEl = $(selector.original).first();
      if (originalEl.length > 0) {
        originalPrice = this.parsePrice(originalEl.text());
      }
    }

    return {
      price,
      originalPrice,
      confidence: selector.confidence || 0.6,
      source: 'html-specific'
    };
  }

  extractGeneric($) {
    const priceSelectors = [
      '[class*="price"]:not([class*="old"]):not([class*="was"]):not([class*="before"])',
      '[data-price]',
      '.current-price',
      '.sale-price',
      '.final-price'
    ];

    const originalPriceSelectors = [
      '[class*="old-price"], [class*="was-price"], [class*="before-price"]',
      '.original-price',
      'del, s, strike',
      '[class*="strike"]'
    ];

    let price = null;
    let originalPrice = null;

    // Chercher le prix actuel
    for (const selector of priceSelectors) {
      const elements = $(selector);
      for (let i = 0; i < elements.length; i++) {
        const candidate = this.parsePrice($(elements[i]).text());
        if (candidate) {
          price = candidate;
          break;
        }
      }
      if (price) break;
    }

    // Chercher le prix original
    for (const selector of originalPriceSelectors) {
      const elements = $(selector);
      for (let i = 0; i < elements.length; i++) {
        const candidate = this.parsePrice($(elements[i]).text());
        if (candidate && candidate > (price || 0)) {
          originalPrice = candidate;
          break;
        }
      }
      if (originalPrice) break;
    }

    if (!price) return null;

    return {
      price,
      originalPrice,
      source: 'html-generic'
    };
  }

  parsePrice(text) {
    if (!text) return null;
    
    // Nettoyer le texte
    const cleaned = text.replace(/[^\d,.\s€$]/g, ' ').trim();
    
    // Patterns pour différents formats de prix
    const patterns = [
      /(\d+)[,.](\d{2})\s*[€$]?/,  // 123,45 ou 123.45
      /(\d+)\s*[€$]/,               // 123€
      /[€$]\s*(\d+[,.]?\d*)/,       // €123.45
      /(\d+[,.]?\d*)/               // 123.45
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let priceStr = match[1];
        if (match[2]) {
          priceStr += '.' + match[2];
        }
        const price = parseFloat(priceStr.replace(',', '.'));
        if (!isNaN(price) && price > 0 && price < 1000000) {
          return price;
        }
      }
    }

    return null;
  }
}
module.exports = HtmlHeuristicExtractor;