class JsonLdExtractor {
  extract($) {
    const results = [];
    
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const text = $(el).html();
        const json = JSON.parse(text);
        const product = this.findProduct(json);
        
        if (product) {
          results.push(this.parseProduct(product));
        }
      } catch (e) {
        // JSON invalide, continuer
      }
    });

    if (results.length === 0) return null;

    // Retourner le résultat avec le plus d'informations
    const best = results.reduce((a, b) => 
      this.calculateCompleteness(a) > this.calculateCompleteness(b) ? a : b
    );

    return {
      ...best,
      confidence: 0.9,
      source: 'json-ld'
    };
  }

  findProduct(json) {
    if (json['@type'] === 'Product') return json;
    if (Array.isArray(json)) {
      for (const item of json) {
        const product = this.findProduct(item);
        if (product) return product;
      }
    }
    if (json['@graph']) {
      return this.findProduct(json['@graph']);
    }
    return null;
  }

  parseProduct(product) {
    const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
    
    return {
      name: product.name,
      price: this.parsePrice(offers?.price || offers?.lowPrice),
      originalPrice: this.parsePrice(offers?.highPrice),
      currency: offers?.priceCurrency || 'EUR',
      availability: offers?.availability,
      brand: product.brand?.name || product.brand,
      description: product.description
    };
  }

  parsePrice(price) {
    if (!price) return null;
    const num = parseFloat(price);
    return !isNaN(num) && num > 0 ? num : null;
  }

  calculateCompleteness(result) {
    let score = 0;
    if (result.name) score += 2;
    if (result.price) score += 3;
    if (result.originalPrice) score += 1;
    if (result.brand) score += 1;
    return score;
  }
}
module.exports = JsonLdExtractor;