import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import AddProduct from './components/AddProduct';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-title">
              🛒 Price Tracker
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Produits</Link>
              <Link to="/add" className="nav-link">Ajouter</Link>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/add" element={<AddProduct />} />
            <Route path="/product/:id" element={<ProductDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;