// ===== client/src/components/ProductDetail.js =====
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams();
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [showAddUrl, setShowAddUrl] = useState(false);
  const navigate = useNavigate();
  
  const handleDeleteProduct = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
    try {
      await productAPI.deleteProduct(id);
      navigate("/"); // retour à la liste
    } catch (err) {
      console.error("Erreur suppression produit:", err);
      alert("Erreur lors de la suppression du produit");
    }
  };
    // Supprimer une URL
    const handleDeleteUrl = async (urlId) => {
        if (!window.confirm("Supprimer ce lien ?")) return;
        try {
            await productAPI.deleteProductUrl(id, urlId);
            loadProductData(); // recharger
        } catch (err) {
            console.error("Erreur suppression URL:", err);
            alert("Erreur lors de la suppression du lien");
        }
    };
  // Formulaire d'ajout d'URL
  const [urlForm, setUrlForm] = useState({
    url: '',
    selector: ''
  });

  useEffect(() => {
    loadProductData();
  }, [id]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProduct(id);
      setProductData(response.data);
    } catch (err) {
      setError('Erreur lors du chargement du produit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lancer le scraping
  const handleScrape = async () => {
    try {
      setScraping(true);
      await productAPI.scrapeProduct(id);
      
      // Recharger les données après scraping
      setTimeout(() => {
        loadProductData();
      }, 1000);
      
    } catch (err) {
      console.error('Erreur scraping:', err);
      alert('Erreur lors du scraping');
    } finally {
      setScraping(false);
    }
  };

  // Ajouter une nouvelle URL
  const handleAddUrl = async (e) => {
    e.preventDefault();
    
    if (!urlForm.url.trim()) {
      alert('L\'URL est requise');
      return;
    }

    try {
      await productAPI.addProductUrl(id, urlForm);
      setUrlForm({ url: '', selector: '' });
      setShowAddUrl(false);
      loadProductData(); // Recharger les données
    } catch (err) {
      console.error('Erreur ajout URL:', err);
      alert('Erreur lors de l\'ajout de l\'URL');
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
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
          <p>Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="container">
        <div className="error">
          <h2>❌ {error}</h2>
          <Link to="/" className="btn btn-primary">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const { product, urls, history } = productData;

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link to="/" className="breadcrumb">← Retour</Link>
          <h1>{product.name}</h1>
          {product.description && (
            <p className="subtitle">{product.description}</p>
          )}
        </div>
        <div className="flex gap-2">
            <button
            onClick={handleScrape}
            disabled={scraping}
            className="btn btn-primary"
            >
            {scraping ? '⏳ Scraping...' : '🔍 Scanner maintenant'}
            </button>
            <button
            onClick={handleDeleteProduct}
            className="btn btn-danger"
            >
            🗑️ Supprimer
            </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* URLs surveillées */}
        <div className="detail-card">
          <div className="card-header">
            <h2>🔗 URLs surveillées ({urls.length})</h2>
            <button
              onClick={() => setShowAddUrl(!showAddUrl)}
              className="btn btn-small"
            >
              ➕ Ajouter URL
            </button>
          </div>
          
          {/* Formulaire d'ajout d'URL */}
          {showAddUrl && (
            <form onSubmit={handleAddUrl} className="add-url-form">
              <div className="form-group">
                <input
                  type="url"
                  placeholder="https://example.com/product"
                  value={urlForm.url}
                  onChange={(e) => setUrlForm({...urlForm, url: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Ajouter
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddUrl(false)}
                  className="btn btn-outline"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
          
          {/* Liste des URLs */}
          <div className="urls-list">
            {urls.length === 0 ? (
              <p className="empty-message">Aucune URL ajoutée</p>
            ) : (
              urls.map(url => (
                <div key={url.id} className="url-item">
                    <div className="url-info">
                    <a 
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="url-link"
                    >
                        {url.url}
                    </a>
                    </div>
                  <div className="url-date">
                    Ajoutée le {formatDate(url.created_at)}
                  </div>
                  <button
                    onClick={() => handleDeleteUrl(url.id)}
                    className="btn btn-danger btn-small"
                    >
                    ❌ Supprimer
                    </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Historique des prix */}
        <div className="detail-card">
          <h2>📈 Historique des prix ({history.length})</h2>
          
          {history.length === 0 ? (
            <p className="empty-message">
              Aucun prix enregistré. Lancez un premier scan !
            </p>
          ) : (
            <div className="history-list">
              {history.map((entry, index) => {
                const previousEntry = history[index + 1];
                const priceChange = previousEntry ? entry.price - previousEntry.price : 0;
                
                return (
                  <div key={entry.id} className="history-item">
                    <div className="history-main">
                      <div className="price-info">
                        <span className="price">{entry.price}€</span>
                        {priceChange !== 0 && (
                          <span className={`price-change ${priceChange < 0 ? 'decrease' : 'increase'}`}>
                            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}€
                            {priceChange < 0 && ' 🎉'}
                          </span>
                        )}
                      </div>
                      <div className="date">
                        {formatDate(entry.scraped_at)}
                      </div>
                    </div>
                    
                    {entry.product_name && entry.product_name !== product.name && (
                      <div className="scraped-name">
                        Nom détecté: {entry.product_name}
                      </div>
                    )}
                    
                    <div className="source-url">
                      <a 
                        href={entry.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="source-link"
                      >
                        🔗 Source
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;