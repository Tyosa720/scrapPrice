// ===== services/ml.js =====
module.exports = {
    predictProductInfo($) {
      const name = predictName($);
      const price = predictPrice($);
      return { name, price };
    }
  };
  
  function predictName($) {
    const candidates = [];
    $('h1, h2, .product-title, .product-name, title').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 3 && text.length < 100) {
        let score = 0;
        if ($(el).is('h1')) score += 5;
        if ($(el).attr('class')?.includes('title')) score += 3;
        candidates.push({ text, score });
      }
    });
    candidates.sort((a, b) => b.score - a.score);
    return candidates.length ? candidates[0].text : 'Produit sans nom';
  }
  
  function predictPrice($) {
    const candidates = [];
    $('span, div, [class*="price"], [data-price]').each((i, el) => {
      let text = $(el).text() || $(el).attr('content') || $(el).attr('data-price') || '';
      const price = parsePrice(text);
      if (price !== null) {
        let score = 0;
        if ($(el).attr('class')?.includes('price')) score += 5;
        if ($(el).is('span')) score += 2;
        candidates.push({ price, score });
      }
    });
    candidates.sort((a, b) => b.score - a.score);
    return candidates.length ? candidates[0].price : null;
  }
  
  function parsePrice(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^\d,.\s€$]/g, ' ').trim();
    const patterns = [
      /(\d+[,.]?\d*)\s*€/,
      /€\s*(\d+[,.]?\d*)/,
      /(\d+[,.]?\d*)\s*EUR/,
      /(\d+[,.]?\d*)/
    ];
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let price = match[1].replace(',', '.');
        const num = parseFloat(price);
        if (!isNaN(num) && num > 0 && num < 100000) return num;
      }
    }
    return null;
  }
  