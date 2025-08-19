// ===== client/src/components/AddProduct.js =====
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Produit, 2: URLs
  const [createdProduct, setCreatedProduct] = useState(null);
  
  // Données du formulaire
  const [productForm, setProductForm] = useState({
    name: '',
    description: ''
  });
  
  const [urls, setUrls] = useState([
    { url: '', selector: '' }
  ]);

  // Créer le produit
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    if (!productForm.name.trim()) {
      alert('Le nom du produit est requis');
      return;
    }

    try {
      setLoading(true);
      const response = await productAPI.createProduct(productForm);
      setCreatedProduct(response.data);
      setStep(2);
    } catch (err) {
      console.error('Erreur création produit:', err);
      alert('Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une ligne d'URL
  const addUrlField = () => {
    setUrls([...urls, { url: '', selector: '' }]);
  };

  // Supprimer une ligne d'URL
  const removeUrlField = (index) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  // Mettre à jour une URL
  const updateUrl = (index, field, value) => {
    const newUrls = urls.map((url, i) => 
      i === index ? { ...url, [field]: value } : url
    );
    setUrls(newUrls);
  };

  // Ajouter les URLs
  const handleAddUrls = async (e) => {
    e.preventDefault();
    
    const validUrls = urls.filter(url => url.url.trim());
    
    if (validUrls.length === 0) {
      alert('Ajoutez au moins une URL');
      return;
    }

    try {
      setLoading(true);
      
      // Ajouter chaque URL
      for (const urlData of validUrls) {
        await productAPI.addProductUrl(createdProduct.id, urlData);
      }
      
      // Rediriger vers le détail du produit
      navigate(`/product/${createdProduct.id}`);
      
    } catch (err) {
      console.error('Erreur ajout URLs:', err);
      alert('Erreur lors de l\'ajout des URLs');
    } finally {
      setLoading(false);
    }
  };

  // Ignorer l'étape URLs et aller au produit
  const skipUrls = () => {
    navigate(`/product/${createdProduct.id}`);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>➕ Ajouter un produit</h1>
        <div className="steps">
          <span className={`step ${step >= 1 ? 'active' : ''}`}>1. Produit</span>
          <span className={`step ${step >= 2 ? 'active' : ''}`}>2. URLs</span>
        </div>
      </div>

      {/* Étape 1: Créer le produit */}
      {step === 1 && (
        <div className="form-card">
          <h2>📦 Informations du produit</h2>
          
          <form onSubmit={handleCreateProduct}>
            <div className="form-group">
              <label htmlFor="name">Nom du produit *</label>
              <input
                id="name"
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                placeholder="Ex: iPhone 15 Pro Max"
                className="form-control"
                required
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Création...' : 'Créer le produit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Étape 2: Ajouter les URLs */}
      {step === 2 && createdProduct && (
        <div className="form-card">
          <h2>🔗 URLs à surveiller</h2>
          <p className="form-subtitle">
            Ajoutez les URLs des sites où vous voulez suivre le prix de <strong>{createdProduct.name}</strong>
          </p>
          
          <form onSubmit={handleAddUrls}>
            {urls.map((url, index) => (
              <div key={index} className="url-form-group">
                <div className="url-inputs">
                  <div className="form-group flex-grow">
                    <input
                      type="url"
                      value={url.url}
                      onChange={(e) => updateUrl(index, 'url', e.target.value)}
                      placeholder="https://example.com/product"
                      className="form-control"
                    />
                  </div>
                  
                  {urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrlField(index)}
                      className="btn btn-danger btn-small"
                    >
                      ❌
                    </button>
                  )}
                </div>
                
                {index === 0 && (
                  <small className="form-help">
                    Le sélecteur CSS permet de cibler précisément l'élément contenant le prix.
                    Si vide, l'application utilisera des sélecteurs automatiques.
                  </small>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addUrlField}
              className="btn btn-outline btn-small add-url-btn"
            >
              ➕ Ajouter une URL
            </button>

            <div className="form-actions">
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Ajout...' : 'Ajouter les URLs'}
              </button>
              
              <button 
                type="button" 
                onClick={skipUrls}
                className="btn btn-outline"
              >
                Ignorer (ajouter plus tard)
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddProduct;
