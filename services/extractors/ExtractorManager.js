const JsonLdExtractor = require("./JsonLdExtractor");
const MetaExtractor = require("./MetaExtractor");
const MicrodataExtractor = require("./MicrodataExtractor");
const HtmlHeuristicExtractor = require("./HtmlHeuristicExtractor");
const { normalizePrice, calculateDiscount } = require('../../utils/PriceUtils');

function combinePrices(results) {
  if (!results.length) return { price: null, originalPrice: null, discountPercent: null };

  // Choisir le prix de référence (JSON-LD > Meta > Microdata > HTML)
  const reference = results.find(r => r.price && r.source === 'json-ld') ||
                    results.find(r => r.price && r.source === 'meta') ||
                    results.find(r => r.price && r.source === 'microdata') ||
                    results.find(r => r.price) || null;

  const referencePrice = reference ? reference.price : null;

  let price = null;
  let originalPrice = null;

  // Normaliser tous les prix par rapport à la référence
  for (const r of results) {
    if (!r) continue;
    if (r.price !== undefined && price === null) price = normalizePrice(r.price, referencePrice);
    if (r.originalPrice !== undefined && originalPrice === null) originalPrice = normalizePrice(r.originalPrice, referencePrice);
  }

  // Fallback HTML si originalPrice non détecté
  const htmlFallback = results.find(r => r.source === 'html-generic');
  if (!originalPrice && htmlFallback && htmlFallback.price > price) {
    originalPrice = normalizePrice(htmlFallback.price, referencePrice);
  }

  const discountPercent = calculateDiscount(price, originalPrice);

  return { price, originalPrice, discountPercent };
}

class ExtractorManager {
  constructor() {
    this.extractors = [
      new JsonLdExtractor(),
      new MetaExtractor(),
      new MicrodataExtractor(),
      new HtmlHeuristicExtractor(),
    ];
  }

  async extract($, url) {
    const domain = new URL(url).hostname;
    const extractorResults = [];

    for (const extractor of this.extractors) {
      try {
        const result = await extractor.extract($, domain);
        if (result) extractorResults.push(result);
      } catch (err) {
        console.warn(`Extracteur ${extractor.constructor.name} échoué:`, err.message);
      }
    }

    if (!extractorResults.length) throw new Error("Aucun extracteur n'a pu trouver les informations produit");

    const combined = combinePrices(extractorResults);
    const bestResult = extractorResults.find(r => r.name) || {};

    return {
      name: bestResult.name || null,
      description: bestResult.description || null,
      brand: bestResult.brand || null,
      source: bestResult.source || 'combined',
      confidence: bestResult.confidence || 0.5,
      ...combined
    };
  }
}

module.exports = ExtractorManager;