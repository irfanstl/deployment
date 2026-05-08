import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api.js';
import { useCart } from '../CartContext.jsx';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const Home = () => {
  const [groupedCategories, setGroupedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const scrollContainerRefs = useRef({});

  const handleScroll = (category, direction) => {
    const container = scrollContainerRefs.current[category];
    if (container) {
      const scrollAmount = 1000;
      container.scrollBy({
        left: direction === 'next' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Uses server-side aggregation — zero client-side grouping needed
        const data = await api.getHomepageProducts();
        setGroupedCategories(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-[320px] sm:h-[420px] rounded-lg overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center px-4 sm:px-8 lg:px-16">
        <div className="absolute inset-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-full sm:max-w-2xl text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight leading-tight"
          >
            Elevate Your Style with <span className="text-slate-300">Nexus</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-200 mb-8"
          >
            Discover a curated collection of premium products designed for the modern lifestyle.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white text-slate-700 px-8 py-3 rounded-lg font-bold flex items-center justify-center w-full sm:w-auto hover:bg-slate-100 transition-all"
          >
            Shop Now <ArrowRight className="ml-2 w-5 h-5" />
          </motion.button>
        </div>
      </section>

      {/* Search & Filter */}
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Featured Products</h2>

      {/* Products by Category */}
      {groupedCategories.length > 0 ? (
        <div className="space-y-10">
          {groupedCategories.map(({ category, products }) => (
            <div key={category} className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{category}</h3>
              <div 
                ref={el => {
                  if (el) scrollContainerRefs.current[category] = el;
                }}
                className="overflow-x-auto scrollbar-hide"
              >
                <div className="flex gap-4 sm:gap-6 pb-4 min-w-min">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex-shrink-0 w-48 sm:w-56 flex flex-col"
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
                          className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-slate-600 hover:bg-slate-700 text-white p-2 sm:p-2.5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl scale-0 group-hover:scale-100"
                        >
                          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </Link>
                      <div className="p-2 sm:p-3 flex-grow flex flex-col">
                        <Link to={`/product/${product.id}`}>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-slate-700 transition-colors mb-1 truncate">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex justify-between items-end mt-auto">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">₹{product.price}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-200">
          <p className="text-slate-500 text-lg">No products found.</p>
        </div>
      )}
    </div>
  );
};
