class MetaExtractor {
  extract($) {
    const metaTags = {
      // Open Graph
      'og:title': $('meta[property="og:title"]').attr('content'),
      'og:price:amount': $('meta[property="og:price:amount"]').attr('content'),
      'og:price:currency': $('meta[property="og:price:currency"]').attr('content'),
      
      // Product schema
      'product:price:amount': $('meta[property="product:price:amount"]').attr('content'),
      'product:price:currency': $('meta[property="product:price:currency"]').attr('content'),
      
      // Twitter Card
      'twitter:data1': $('meta[name="twitter:data1"]').attr('content'),
      'twitter:label1': $('meta[name="twitter:label1"]').attr('content'),
      
      // Generic price meta
      'price': $('meta[name="price"], meta[itemprop="price"]').attr('content'),
      'priceCurrency': $('meta[itemprop="priceCurrency"]').attr('content')
    };

    const name = metaTags['og:title'] || $('title').text().trim();
    const price = this.extractPrice(metaTags);
    
    if (!price) return null;

    return {
      name,
      price,
      currency: metaTags['og:price:currency'] || metaTags['product:price:currency'] || 'EUR',
      confidence: 0.7,
      source: 'meta-tags'
    };
  }

  extractPrice(tags) {
    const priceFields = [
      'og:price:amount',
      'product:price:amount', 
      'price'
    ];

    for (const field of priceFields) {
      if (tags[field]) {
        const price = parseFloat(tags[field]);
        if (!isNaN(price) && price > 0) return price;
      }
    }

    // Essayer d'extraire depuis twitter:data1 si c'est un prix
    if (tags['twitter:label1']?.toLowerCase().includes('prix') && tags['twitter:data1']) {
      return this.parsePrice(tags['twitter:data1']);
    }

    return null;
  }

  parsePrice(text) {
    const match = text.match(/(\d+[,.]?\d*)/);
    if (match) {
      const price = parseFloat(match[1].replace(',', '.'));
      return !isNaN(price) && price > 0 ? price : null;
    }
    return null;
  }
}
module.exports = MetaExtractor;