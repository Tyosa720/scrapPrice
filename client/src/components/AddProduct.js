import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  // Auto-complete du nom via l'URL
  const handleUrlChange = async (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    if (newUrl.startsWith('http')) {
      try {
        setLoading(true);
        // Appelle la route GET /scrape-url?url=...
        const response = await productAPI.scrapeUrl(newUrl);
        if (response.data?.name) {
          setName(response.data.name);
        }
      } catch (err) {
        console.warn('Impossible de récupérer le nom depuis l\'URL', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Le nom du produit est requis');
      return;
    }

    try {
      setLoading(true);
      // Crée le produit avec le nom récupéré
      const response = await productAPI.createProduct({ name });
      const product = response.data;

      // Ajoute l'URL directement aux URLs à surveiller
      if (url) {
        await productAPI.addProductUrl(product.id, { url });
      }

      // Redirige vers la page produit
      navigate(`/product/${product.id}`);
    } catch (err) {
      console.error('Erreur création produit:', err);
      alert('Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">📦 Ajouter un produit via URL</h2>
        <form onSubmit={handleCreateProduct} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">URL du produit *</label>
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com/product"
              className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom du produit *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du produit..."
              className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Création...' : 'Créer le produit et ajouter l’URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;