// ===== utils/PriceUtils.js =====
function normalizePrice(price, referencePrice = null) {
  if (price === undefined || price === null) return null;

  // Nettoyage
  if (typeof price === 'string') {
    price = price.replace(/[^\d.,]/g, '').replace(',', '.');
    price = parseFloat(price);
  }

  if (isNaN(price)) return null;

  // Ajuster l’échelle si on a un prix de référence
  if (referencePrice && price > 0 && price < referencePrice / 2) {
    // Si le prix est beaucoup plus petit que la référence, multiplier
    let factor = 10;
    while (price * factor < referencePrice * 0.8) {
      factor *= 10;
    }
    price = price * factor;
  }

  return price;
}

function calculateDiscount(price, originalPrice) {
  if (price !== null && originalPrice !== null && originalPrice > price) {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }
  return null;
}

module.exports = { normalizePrice, calculateDiscount };