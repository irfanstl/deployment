import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api.js';
import { useCart } from '../CartContext.jsx';
import { toast } from 'react-hot-toast';

export const SearchResults = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const data = await api.searchProducts(query);
        setProducts(data.products || []);
        setSuggestion(data.suggestion || null);
      } catch (error) {
        console.error('Error fetching search results:', error);
        toast.error('Failed to load search results');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Search Results {query && <span className="text-slate-500 font-medium">for "{query}"</span>}
        </h2>
        <p className="text-slate-500 font-medium">
          {products.length} {products.length === 1 ? 'Product' : 'Products'} Found
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden flex-shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 rounded text-[10px] sm:text-xs font-bold text-slate-600 shadow-sm">
                  {product.category}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart(product);
                    toast.success('Added to cart!');
                  }}
                  className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-slate-600 hover:bg-slate-700 text-white p-2 sm:p-2.5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl scale-0 group-hover:scale-100 flex items-center justify-center"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </Link>
              <div className="p-3 sm:p-4 flex-grow flex flex-col">
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-slate-700 transition-colors mb-1 truncate">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex justify-between items-end mt-auto pt-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900">₹{product.price}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-200">
          <p className="text-slate-500 text-lg mb-2">No products found matching "{query}".</p>
          {suggestion && (
            <p className="text-slate-600">
              Did you mean: <Link to={`/search?q=${encodeURIComponent(suggestion)}`} className="font-bold text-slate-800 hover:text-slate-600 underline decoration-2 underline-offset-4 transition-colors">{suggestion}</Link>?
            </p>
          )}
        </div>
      )}
    </div>
  );
};
