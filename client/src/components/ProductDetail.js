import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI } from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [activeTab, setActiveTab] = useState('urls');
  
  const [urlForm, setUrlForm] = useState({
    url: '',
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

  const handleScrape = async () => {
    try {
      setScraping(true);
      await productAPI.scrapeProduct(id);
      setTimeout(() => {
        loadProductData();
      }, 1000);
    } catch (err) {
      console.error('Erreur scraping:', err);
    } finally {
      setScraping(false);
    }
  };

  const handleAddUrl = async (e) => {
    e.preventDefault();
    
    if (!urlForm.url.trim()) {
      alert('L\'URL est requise');
      return;
    }

    try {
      await productAPI.addProductUrl(id, urlForm);
      setUrlForm({ url: ''});
      setShowAddUrl(false);
      loadProductData();
    } catch (err) {
      console.error('Erreur ajout URL:', err);
      alert('Erreur lors de l\'ajout de l\'URL');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriceEvolution = (history) => {
    if (history.length < 2) return null;
    
    const latest = history[0];
    const previous = history[1];
    const change = latest.price - previous.price;
    const changePercent = ((change / previous.price) * 100);
    
    return {
      change,
      changePercent,
      isIncrease: change > 0,
      isDecrease: change < 0
    };
  };

  const getLowestPrice = (history) => {
    if (!history.length) return null;
    return Math.min(...history.map(h => h.price));
  };

  const getHighestPrice = (history) => {
    if (!history.length) return null;
    return Math.max(...history.map(h => h.price));
  };

  const handleDeleteUrl = async (urlId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette URL ?")) return;

    try {
      await productAPI.deleteProductUrl(id, urlId);
      loadProductData();
    } catch (err) {
      console.error("Erreur suppression URL:", err);
      alert("Erreur lors de la suppression de l'URL");
    }
  };
    // Supprimer un produit
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit ?")) return;

    try {
      await productAPI.deleteProduct(productId);
      window.location.href = '/';
    } catch (err) {
      console.error("Erreur suppression produit:", err);
      alert("Erreur lors de la suppression du produit");
    }
  };
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">{error}</h2>
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { product, urls, history } = productData;
  const priceEvolution = getPriceEvolution(history);
  const lowestPrice = getLowestPrice(history);
  const highestPrice = getHighestPrice(history);
  const currentPrice = history.length > 0 ? history[0].price : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb et header */}
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-4">
          <Link to="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-800 font-medium">{product.name}</span>
        </nav>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{product.name}</h1>
              {product.description && (
                <p className="text-slate-600 text-lg">{product.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-4 text-sm text-slate-500">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Créé le {formatDate(product.created_at)}
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {urls.length} URL{urls.length > 1 ? 's' : ''} surveillée{urls.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleScrape}
                disabled={scraping}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                {scraping ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Scanner maintenant</span>
                  </>
                )}
              </button>
              <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="px-6 py-4 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  ❌
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques de prix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Prix actuel</p>
              <p className="text-2xl font-bold text-blue-600">
                {currentPrice ? `${currentPrice}€` : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          {priceEvolution && (
            <div className={`flex items-center mt-2 text-sm ${priceEvolution.isDecrease ? 'text-green-600' : 'text-red-600'}`}>
              <svg className={`w-4 h-4 mr-1 ${priceEvolution.isDecrease ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l10-10M17 7v10M17 7H7" />
              </svg>
              <span>
                {priceEvolution.isDecrease ? '-' : '+'}{Math.abs(priceEvolution.change).toFixed(2)}€ 
                ({Math.abs(priceEvolution.changePercent).toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Prix le plus bas</p>
              <p className="text-2xl font-bold text-green-600">
                {lowestPrice ? `${lowestPrice}€` : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
          {currentPrice && lowestPrice && currentPrice !== lowestPrice && (
            <div className="text-sm text-slate-500 mt-2">
              +{(currentPrice - lowestPrice).toFixed(2)}€ vs minimum
            </div>
          )}
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Prix le plus haut</p>
              <p className="text-2xl font-bold text-red-600">
                {highestPrice ? `${highestPrice}€` : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          {currentPrice && highestPrice && currentPrice !== highestPrice && (
            <div className="text-sm text-green-600 mt-2">
              -{(highestPrice - currentPrice).toFixed(2)}€ vs maximum
            </div>
          )}
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Relevés</p>
              <p className="text-2xl font-bold text-purple-600">{history.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          {history.length > 0 && (
            <div className="text-sm text-slate-500 mt-2">
              Depuis le {formatDate(history[history.length - 1]?.scraped_at)}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('urls')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'urls'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>URLs Surveillées ({urls.length})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Historique ({history.length})</span>
              </span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: URLs */}
          {activeTab === 'urls' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">URLs de surveillance</h2>
                <button
                  onClick={() => setShowAddUrl(!showAddUrl)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Ajouter URL</span>
                </button>
              </div>

              {/* Formulaire d'ajout d'URL */}
              {showAddUrl && (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-medium text-slate-800 mb-4">Nouvelle URL de surveillance</h3>
                  <form onSubmit={handleAddUrl} className="space-y-4">
                    <div>
                      <label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-2">
                        URL du produit *
                      </label>
                      <input
                        id="url"
                        type="url"
                        placeholder="https://example.com/product"
                        value={urlForm.url}
                        onChange={(e) => setUrlForm({...urlForm, url: e.target.value})}
                        className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                      >
                        Ajouter l'URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddUrl(false)}
                        className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors duration-200"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Liste des URLs */}
              {urls.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">Aucune URL configurée</h3>
                  <p className="text-slate-600 mb-4">Ajoutez des URLs pour commencer à surveiller les prix de ce produit.</p>
                  <button
                    onClick={() => setShowAddUrl(true)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Ajouter la première URL
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {urls.map((url, index) => (
                    <div key={url.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              URL #{index + 1}
                            </span>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-slate-500">Active</span>
                          </div>
                          <a
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium break-all transition-colors duration-200"
                          >
                            {url.url}
                          </a>
                          <div className="text-xs text-slate-500 mt-2">
                            Ajoutée le {formatDate(url.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <a
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors duration-200"
                            title="Ouvrir dans un nouvel onglet"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                           {/* Nouveau bouton supprimer */}
                          <button
                            onClick={() => handleDeleteUrl(url.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors duration-200"
                            title="Supprimer cette URL"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Historique */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Historique des prix</h2>
                <div className="text-sm text-slate-500">
                  {history.length} relevé{history.length > 1 ? 's' : ''}
                </div>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">Aucun historique</h3>
                  <p className="text-slate-600 mb-4">Aucun prix n'a encore été enregistré. Lancez un premier scan pour commencer !</p>
                  <button
                    onClick={handleScrape}
                    disabled={scraping}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    {scraping ? 'Scan en cours...' : 'Lancer un scan'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry, index) => {
                    const previousEntry = history[index + 1];
                    const priceChange = previousEntry ? entry.price - previousEntry.price : 0;
                    const isPromo = priceChange < 0;
                    
                    return (
                      <div key={entry.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-center">
                              <div className={`text-2xl font-bold ${isPromo ? 'text-green-600' : 'text-blue-600'}`}>
                                {entry.price}€
                              </div>
                              {priceChange !== 0 && (
                                <div className={`flex items-center text-sm ${priceChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  <svg className={`w-4 h-4 mr-1 ${priceChange < 0 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l10-10M17 7v10M17 7H7" />
                                  </svg>
                                  <span>
                                    {priceChange < 0 ? '' : '+'}{priceChange.toFixed(2)}€
                                    {isPromo && ' 🎉'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">
                              Relevé du {formatDate(entry.scraped_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;