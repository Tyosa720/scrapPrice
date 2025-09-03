// ===== client/src/components/AddProduct.js =====
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productAPI } from '../services/api';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [createdProduct, setCreatedProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: ''
  });

  const [urls, setUrls] = useState([{ url: '', selector: '' }]);

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

  // Ajouter une URL
  const handleAddUrls = async (e) => {
    e.preventDefault();
    const validUrls = urls.filter((u) => u.url.trim());
    if (validUrls.length === 0) {
      alert('Ajoutez au moins une URL');
      return;
    }
    try {
      setLoading(true);
      for (const urlData of validUrls) {
        await productAPI.addProductUrl(createdProduct.id, urlData);
      }
      navigate(`/product/${createdProduct.id}`);
    } catch (err) {
      console.error('Erreur ajout URLs:', err);
      alert("Erreur lors de l'ajout des URLs");
    } finally {
      setLoading(false);
    }
  };

  const addUrlField = () => setUrls([...urls, { url: '', selector: '' }]);
  const removeUrlField = (i) => setUrls(urls.filter((_, idx) => idx !== i));
  const updateUrl = (i, field, value) => {
    setUrls(urls.map((u, idx) => (idx === i ? { ...u, [field]: value } : u)));
  };

  const skipUrls = () => navigate(`/product/${createdProduct.id}`);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-4">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-800 font-medium">
            Ajouter un produit
          </span>
        </nav>
        <h1 className="text-3xl font-bold text-slate-800">➕ Ajouter un produit</h1>
        <div className="flex space-x-6 mt-4 text-sm">
          <span className={`pb-1 border-b-2 ${step >= 1 ? 'border-blue-500 text-blue-600' : 'border-slate-300 text-slate-400'}`}>
            1. Produit
          </span>
          <span className={`pb-1 border-b-2 ${step >= 2 ? 'border-blue-500 text-blue-600' : 'border-slate-300 text-slate-400'}`}>
            2. URLs
          </span>
        </div>
      </div>

      {/* Étape 1 */}
      {step === 1 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            📦 Informations du produit
          </h2>
          <form onSubmit={handleCreateProduct} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Nom du produit *
              </label>
              <input
                id="name"
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Ex: iPhone 15 Pro Max"
                className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Description (optionnelle)
              </label>
              <textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Description du produit..."
                className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                rows="3"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? 'Création...' : 'Créer le produit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Étape 2 */}
      {step === 2 && createdProduct && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">🔗 URLs à surveiller</h2>
          <p className="text-slate-600 mb-6">
            Ajoutez les URLs des sites où vous voulez suivre le prix de <strong>{createdProduct.name}</strong>
          </p>
          <form onSubmit={handleAddUrls} className="space-y-6">
            {urls.map((url, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    value={url.url}
                    onChange={(e) => updateUrl(i, 'url', e.target.value)}
                    placeholder="https://example.com/product"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <input
                    type="text"
                    value={url.selector}
                    onChange={(e) => updateUrl(i, 'selector', e.target.value)}
                    placeholder="Sélecteur CSS (optionnel)"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  {urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrlField(i)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      ❌
                    </button>
                  )}
                </div>
                {i === 0 && (
                  <p className="text-xs text-slate-500">
                    Le sélecteur CSS permet de cibler précisément l’élément contenant le prix.
                  </p>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addUrlField}
              className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium rounded-lg transition"
            >
              ➕ Ajouter une URL
            </button>
            <div className="flex items-center space-x-3 justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? 'Ajout...' : 'Ajouter les URLs'}
              </button>
              <button
                type="button"
                onClick={skipUrls}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition"
              >
                Ignorer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddProduct;