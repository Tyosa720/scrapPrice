function parsePrice(text) {
  if (!text) return null;

  // Nettoyer le texte : garder chiffres, points, virgules
  const cleaned = text.replace(/[^\d,.\s]/g, '').trim();

  // Regex pour extraire le premier nombre
  const patterns = [
    /(\d+[,.]?\d*)/, // match général
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      // Convertir virgule en point
      const num = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(num) && num > 0 && num < 100000) return num;
    }
  }

  return null;
}

module.exports = { parsePrice };