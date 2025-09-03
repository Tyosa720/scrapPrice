const express = require('express');
const router = express.Router();
const db = require('../database/init');
const PriceScraper = require('../core/PriceScraper');
const scraper = new PriceScraper();

// GET /api/products - Liste tous les produits avec leurs prix actuels
router.get('/products', (req, res) => {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.created_at,
      COUNT(pu.id) AS url_count,
      ph.price AS current_price,
      ph.original_price AS original_price,
      ph.discount_percent AS discount_percent,
      ph.currency AS currency,
      ph.scraped_at AS last_update,
      CASE 
        WHEN ph.original_price IS NOT NULL AND ph.price < ph.original_price THEN 1 
        ELSE 0 
      END AS is_promotion
    FROM products p
    LEFT JOIN product_urls pu ON p.id = pu.product_id
    LEFT JOIN price_history ph ON p.id = ph.product_id 
      AND ph.id = (
        SELECT id FROM price_history 
        WHERE product_id = p.id 
        ORDER BY scraped_at DESC 
        LIMIT 1
      )
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/products/:id - Détail d'un produit avec historique
router.get('/products/:id', (req, res) => {
  const productId = req.params.id;

  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    db.all('SELECT * FROM product_urls WHERE product_id = ?', [productId], (err, urls) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(`
        SELECT ph.*, pu.url 
        FROM price_history ph
        JOIN product_urls pu ON ph.url_id = pu.id
        WHERE ph.product_id = ?
        ORDER BY ph.scraped_at DESC
        LIMIT 50
      `, [productId], (err, history) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          product,
          urls,
          history
        });
      });
    });
  });
});

// POST /api/products - Créer un nouveau produit
router.post('/products', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Le nom du produit est requis' });

  db.run(
    'INSERT INTO products (name, description) VALUES (?, ?)',
    [name, description],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        id: this.lastID,
        name,
        description,
        message: 'Produit créé avec succès'
      });
    }
  );
});

// POST /api/products/:id/urls - Ajouter une URL à un produit
router.post('/products/:id/urls', (req, res) => {
  const productId = req.params.id;
  const { url} = req.body;
  if (!url) return res.status(400).json({ error: 'L\'URL est requise' });

  db.get('SELECT id FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    db.run(
      'INSERT INTO product_urls (product_id, url) VALUES (?, ?)',
      [productId, url],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });

        res.status(201).json({
          id: this.lastID,
          product_id: productId,
          url,
          message: 'URL ajoutée avec succès'
        });
      }
    );
  });
});

router.post('/scrape/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const results = await scraper.scrapeProduct(productId);
    res.json({
      message: 'Scraping terminé',
      results
    });
  } catch (error) {
    console.error('Erreur lors du scraping:', error);
    res.status(500).json({
      error: 'Erreur lors du scraping',
      details: error.message
    });
  }
});

// DELETE /api/products/:id - Supprimer un produit et ses données associées
router.delete('/products/:id', (req, res) => {
  const productId = req.params.id;

  db.serialize(() => {
    db.run('DELETE FROM price_history WHERE product_id = ?', [productId]);
    db.run('DELETE FROM product_urls WHERE product_id = ?', [productId]);
    db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Produit non trouvé' });
      res.json({ message: 'Produit supprimé avec succès' });
    });
  });
});

// DELETE /api/products/:id/urls/:urlId - Supprimer une URL d’un produit
router.delete('/products/:id/urls/:urlId', (req, res) => {
  const { id: productId, urlId } = req.params;

  db.serialize(() => {
    db.run('DELETE FROM price_history WHERE url_id = ?', [urlId]);
    db.run('DELETE FROM product_urls WHERE id = ? AND product_id = ?', [urlId, productId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'URL non trouvée' });
      res.json({ message: 'URL supprimée avec succès' });
    });
  });
});
// GET /api/scrape-url?url=... - Scrape une URL pour auto-complétion
router.get('/scrape-url', async (req, res) => {
  const { url } = req.query;
  console.log('Requête de scraping pour auto-complétion avec URL:', url);
  if (!url) return res.status(400).json({ error: 'L\'URL est requise' });

  try {
    console.log('Scraping de l\'URL pour auto-complétion:', url);
    const result = await scraper.scrapeUrlInfo(url); // Tu peux créer une méthode scrapeUrl dans PriceScraper qui scrape un produit depuis l'URL
    if (!result) return res.status(404).json({ error: 'Aucune info trouvée pour cette URL' });

    // On ne renvoie que les champs utiles pour l'auto-complétion
    res.json({
      name: result.name || null,
      description: result.description || null,
      brand: result.brand || null
    });
  } catch (err) {
    console.error('Erreur lors du scraping de l\'URL:', err);
    res.status(500).json({ error: 'Erreur lors du scraping de l\'URL', details: err.message });
  }
});
module.exports = router;