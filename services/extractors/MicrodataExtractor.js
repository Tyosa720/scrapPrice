class MicrodataExtractor {
  extract($) {
    const products = $('[itemtype*="Product"]');
    
    if (products.length === 0) return null;

    const product = products.first();
    const name = product.find('[itemprop="name"]').text().trim();
    const priceEl = product.find('[itemprop="price"]');
    const price = this.extractPrice(priceEl);

    if (!price) return null;

    return {
      name: name || $('h1').first().text().trim(),
      price,
      currency: product.find('[itemprop="priceCurrency"]').attr('content') || 'EUR',
      availability: product.find('[itemprop="availability"]').attr('href'),
      confidence: 0.8,
      source: 'microdata'
    };
  }

  extractPrice(element) {
    if (element.length === 0) return null;
    
    // Essayer l'attribut content d'abord
    const content = element.attr('content');
    if (content) {
      const price = parseFloat(content);
      if (!isNaN(price)) return price;
    }

    // Sinon essayer le texte
    const text = element.text();
    return this.parsePrice(text);
  }

  parsePrice(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^\d,.\s€$]/g, '').trim();
    const match = cleaned.match(/(\d+[,.]?\d*)/);
    
    if (match) {
      const price = parseFloat(match[1].replace(',', '.'));
      return !isNaN(price) && price > 0 ? price : null;
    }
    return null;
  }
}

module.exports = MicrodataExtractor;
