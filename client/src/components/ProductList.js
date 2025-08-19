// ===== client/src/components/ProductList.js =====
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrapingIds, setScrapingIds] = useState(new Set());

  // Charger les produits au montage du composant
  useEffect(() => {
    loadProducts();
  }, []);
// Supprimer un produit
    const handleDeleteProduct = async (productId) => {
        try {
        await productAPI.deleteProduct(productId);
        loadProducts(); // recharger
        } catch (err) {
        console.error("Erreur suppression produit:", err);
        alert("Erreur lors de la suppression du produit");
        }
    };
  
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProducts();
      setProducts(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des produits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lancer le scraping d'un produit
  const handleScrape = async (productId) => {
    if (scrapingIds.has(productId)) return;

    try {
      setScrapingIds(prev => new Set([...prev, productId]));
      await productAPI.scrapeProduct(productId);
      
      // Recharger les données après scraping
      setTimeout(() => {
        loadProducts();
      }, 1000);
      
    } catch (err) {
      console.error('Erreur scraping:', err);
      alert('Erreur lors du scraping');
    } finally {
      setScrapingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>❌ {error}</h2>
          <button onClick={loadProducts} className="btn btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>📊 Mes Produits</h1>
        <Link to="/add" className="btn btn-primary">
          ➕ Ajouter un produit
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <h2>🛒 Aucun produit</h2>
          <p>Commencez par ajouter votre premier produit à surveiller !</p>
          <Link to="/add" className="btn btn-primary">
            Ajouter un produit
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="card-header">
                <h3>{product.name}</h3>
                {product.is_promotion ? (
                  <span className="badge badge-success">🎉 PROMO</span>
                ) : (
                  <span className="badge badge-default">📊 Normal</span>
                )}
              </div>
              
              <div className="card-body">
                {product.description && (
                  <p className="description">{product.description}</p>
                )}
                
                <div className="product-stats">
                  <div className="stat">
                    <span className="label">Prix actuel:</span>
                    <span className="value price">
                      {product.current_price ? `${product.current_price}€` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="stat">
                    <span className="label">URLs suivies:</span>
                    <span className="value">{product.url_count}</span>
                  </div>
                  
                  <div className="stat">
                    <span className="label">Dernière MAJ:</span>
                    <span className="value">{formatDate(product.last_update)}</span>
                  </div>
                </div>
              </div>
              
              <div className="card-actions">
                <Link 
                  to={`/product/${product.id}`} 
                  className="btn btn-outline"
                >
                  📈 Détails
                </Link>
                
                <button
                  onClick={() => handleScrape(product.id)}
                  disabled={scrapingIds.has(product.id)}
                  className="btn btn-primary"
                >
                  {scrapingIds.has(product.id) ? (
                    <>⏳ Scraping...</>
                  ) : (
                    <>🔍 Scanner</>
                  )}
                </button>
                <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="btn btn-danger"
                >
                    🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;