import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gestion des erreurs globales
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erreur API:', error);
    return Promise.reject(error);
  }
);

export const productAPI = {
  // Récupérer tous les produits
  getProducts: () => api.get('/products'),
  
  // Récupérer un produit spécifique
  getProduct: (id) => api.get(`/products/${id}`),
  
  // Créer un produit
  createProduct: (data) => api.post('/products', data),
  
  // Ajouter une URL à un produit
  addProductUrl: (productId, data) => api.post(`/products/${productId}/urls`, data),
  
  // Lancer le scraping
  scrapeProduct: (id) => api.post(`/scrape/${id}`),


  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Supprimer une URL d’un produit
  deleteProductUrl: (productId, urlId) => api.delete(`/products/${productId}/urls/${urlId}`)
};

export default api;