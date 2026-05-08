import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, User as UserIcon } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Email and password required');
    if (!isLogin && !displayName) return toast.error('Name is required');

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login({ email, password });
        toast.success('Welcome back!');
      } else {
        await register({ email, password, displayName });
        toast.success('Account created successfully!');
      }
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success('Successfully logged in with Google!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Google authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-lg shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-500">
            {isLogin ? 'Sign in to access your dashboard' : 'Join us to get started'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSubmit} 
            className="space-y-5"
          >
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-600 transition-all">
                  <UserIcon className="ml-4 text-gray-400 w-5 h-5 flex-shrink-0" />
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    className="flex-1 px-3 py-3 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-600 transition-all">
                <Mail className="ml-4 text-gray-400 w-5 h-5 flex-shrink-0" />
                <input
                  required
                  type="email"
                  placeholder="email@example.com"
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-600 transition-all">
                <Lock className="ml-4 text-gray-400 w-5 h-5 flex-shrink-0" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-600 text-white py-4 mt-2 rounded-lg font-bold flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" /> {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 mt-4 rounded-lg font-bold flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>

            <div className="mt-6 text-center">
              <button 
                type="button"
                onClick={toggleMode}
                className="text-sm text-slate-600 font-bold hover:underline"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
