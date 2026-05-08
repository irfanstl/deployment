import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, Menu, X, ShieldCheck, Search } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { useCart } from '../CartContext.jsx';
import { api } from '../services/api.js';

export const Navbar = ({ onSearchChange, searchTerm }) => {
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionTip, setSuggestionTip] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      setSuggestionTip(null);
      setShowDropdown(false);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await api.searchProducts(searchTerm);
        setSuggestions(data.products?.slice(0, 5) || []);
        setSuggestionTip(data.suggestion || null);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo - Left */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-slate-600 tracking-tight whitespace-nowrap">
              NEXUS
            </Link>
          </div>

          {/* Desktop Nav - Right */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Search */}
            <div className="relative" ref={searchRef}>
              <div className="flex items-center bg-gray-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-600 transition-all w-96">
                <Search className="ml-3 text-slate-400 w-4 h-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 px-2 py-2 bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400"
                  value={searchTerm || ''}
                  onFocus={() => {
                    if (searchTerm && (suggestions.length > 0 || suggestionTip)) {
                      setShowDropdown(true);
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (onSearchChange) onSearchChange(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value;
                      setShowDropdown(false);
                      if (val.trim()) {
                        navigate(`/search?q=${encodeURIComponent(val)}`);
                      } else {
                        navigate(`/search`);
                      }
                      if (onSearchChange) onSearchChange('');
                    }
                  }}
                />
              </div>
              {/* Dropdown Suggestions */}
              {showDropdown && (suggestions.length > 0 || suggestionTip) && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
                  {suggestions.length > 0 && (
                    <ul>
                      {suggestions.map((p) => (
                        <li key={p.id}>
                          <button
                            className="w-full flex items-center px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-b-0"
                            onClick={() => {
                              setShowDropdown(false);
                              if (onSearchChange) onSearchChange('');
                              navigate(`/product/${p.id}`);
                            }}
                          >
                            <img src={p.image} className="w-8 h-8 rounded object-cover mr-3" alt="" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-sm font-bold text-slate-800 line-clamp-1">{p.name}</p>
                              <p className="text-xs font-medium text-slate-500">₹{p.price}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {suggestions.length === 0 && suggestionTip && (
                    <div className="px-4 py-4 text-center border-t border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">No exact matches</p>
                      <button 
                        onClick={() => {
                          setShowDropdown(false);
                          if (onSearchChange) onSearchChange('');
                          navigate(`/search?q=${encodeURIComponent(suggestionTip)}`);
                        }}
                        className="text-sm font-bold text-slate-800 hover:text-slate-600 underline decoration-2 underline-offset-4"
                      >
                        Did you mean: {suggestionTip}?
                      </button>
                    </div>
                  )}
                  
                  {suggestions.length > 0 && (
                     <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                          if (onSearchChange) onSearchChange('');
                        }}
                        className="w-full px-4 py-2 bg-slate-50 text-xs font-bold text-slate-600 hover:text-slate-900 border-t border-slate-100 text-center"
                     >
                        View all results
                     </button>
                  )}
                </div>
              )}
            </div>

            {/* Shop */}
            <Link to="/" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">Shop</Link>

            {/* Admin */}
            {isAdmin && (
              <Link to="/admin" className="flex items-center text-slate-600 hover:text-slate-800 font-medium transition-colors">
                <ShieldCheck className="w-4 h-4 mr-1" />
                Admin
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="p-2 text-slate-600 hover:text-slate-800 transition-colors relative">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-slate-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile / Login / Logout */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 hover:bg-slate-200 transition-colors" title={user.displayName}>
                  {user.displayName[0]}
                </Link>
                <button onClick={logout} className="p-2 text-slate-600 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="bg-slate-600 text-white px-5 py-2 rounded-full font-medium hover:bg-slate-700 transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-4">
          <Link to="/" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Shop</Link>
          {isAdmin && (
            <Link to="/admin" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>
          )}
          <Link to="/cart" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>
            Cart ({cartCount})
          </Link>
          {user && (
            <Link to="/profile" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>My Profile</Link>
          )}
          {user ? (
            <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block text-red-500 font-medium">Sign Out</button>
          ) : (
            <Link to="/login" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
};
