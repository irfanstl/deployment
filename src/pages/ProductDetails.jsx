import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw, Star, FileText } from 'lucide-react';
import { api } from '../services/api.js';
import { useCart } from '../CartContext.jsx';
import { toast } from 'react-hot-toast';

export const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      if (!id) return;
      try {
        const [productData, reviewsData] = await Promise.all([
          api.getProduct(id),
          api.getProductReviews(id).catch(() => []) // Catch errors to fallback
        ]);
        setProduct(productData);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Product not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [id, navigate]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    try {
      const newReview = await api.addProductReview(id, { rating: newRating, comment: newComment });
      setReviews([newReview, ...reviews]);
      setNewComment('');
      setNewRating(0);
      toast.success('Review added successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to add review. Please log in.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRfq = async () => {
    const details = window.prompt("Please provide details for your quote request (e.g., quantity, special requirements):");
    if (!details) return;
    try {
      await api.submitRfq({ productId: product.id, quantity: 1, details });
      toast.success('Quote request submitted successfully!');
    } catch (err) {
      toast.error('Failed to submit quote request. Please log in.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) return null;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-slate-600 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to shop
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex flex-col">
          <div className="mb-6">
            <span className="text-slate-600 font-bold text-sm uppercase tracking-widest mb-2 block">
              {product.category}
            </span>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              {product.name}
            </h1>

            {/* Dynamic Rating Display */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1.5" />
                <span className="font-bold text-yellow-700 text-sm">{averageRating > 0 ? averageRating : 'New'}</span>
              </div>
              <a href="#reviews" className="text-sm text-gray-500 font-medium hover:text-indigo-600 hover:underline transition-colors">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </a>
            </div>

            <p className="text-3xl font-bold text-slate-600 mb-6">
              ₹{product.price}
            </p>
            <p className="text-gray-600 leading-relaxed mb-8 text-lg">
              {product.description}
            </p>

            {/* Advanced CNC Tool Specs */}
            {(product.dimensions || product.materialCompatibility?.length > 0 || product.coating || product.technicalDocs) && (
              <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-slate-600" /> Technical Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  {product.dimensions && (
                    <>
                      {product.dimensions.shankDiameter && (
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500 font-medium">Shank Diameter</span>
                          <span className="font-bold text-slate-800">{product.dimensions.shankDiameter}</span>
                        </div>
                      )}
                      {product.dimensions.fluteLength && (
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500 font-medium">Flute Length</span>
                          <span className="font-bold text-slate-800">{product.dimensions.fluteLength}</span>
                        </div>
                      )}
                      {product.dimensions.overallLength && (
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500 font-medium">Overall Length</span>
                          <span className="font-bold text-slate-800">{product.dimensions.overallLength}</span>
                        </div>
                      )}
                      {product.dimensions.tolerance && (
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500 font-medium">Tolerance</span>
                          <span className="font-bold text-slate-800">{product.dimensions.tolerance}</span>
                        </div>
                      )}
                    </>
                  )}
                  {product.coating && (
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium">Coating</span>
                      <span className="font-bold text-slate-800">{product.coating}</span>
                    </div>
                  )}
                  {product.materialCompatibility?.length > 0 && (
                    <div className="flex justify-between border-b border-slate-200 pb-2 col-span-1 sm:col-span-2">
                      <span className="text-slate-500 font-medium">Material Compatibility</span>
                      <span className="font-bold text-slate-800 text-right">{product.materialCompatibility.join(', ')}</span>
                    </div>
                  )}
                </div>
                
                {product.technicalDocs && (product.technicalDocs.speedsAndFeedsUrl || product.technicalDocs.sdsUrl) && (
                  <div className="mt-6 flex flex-wrap gap-4">
                    {product.technicalDocs.speedsAndFeedsUrl && (
                      <a href={product.technicalDocs.speedsAndFeedsUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold px-4 py-2 rounded-lg transition-colors text-xs uppercase tracking-wide">
                        Speeds & Feeds Chart (PDF)
                      </a>
                    )}
                    {product.technicalDocs.sdsUrl && (
                      <a href={product.technicalDocs.sdsUrl} target="_blank" rel="noopener noreferrer" className="text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold px-4 py-2 rounded-lg transition-colors text-xs uppercase tracking-wide">
                        Safety Data Sheet (SDS)
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6 mt-auto">
            <div className="flex items-center space-x-4">
              {product.isRfqOnly ? (
                <button
                  onClick={handleRfq}
                  className="flex-1 bg-amber-500 text-white py-4 rounded-lg font-bold flex items-center justify-center hover:bg-amber-600 transition-all shadow-lg"
                >
                  <FileText className="w-5 h-5 mr-2" /> Request Quote
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      addToCart(product);
                      toast.success('Added to cart!');
                    }}
                    className="flex-1 bg-slate-600 text-white py-4 rounded-lg font-bold flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleRfq}
                    className="bg-white border border-slate-200 text-slate-700 py-4 px-6 rounded-lg font-bold flex items-center justify-center hover:bg-slate-50 transition-colors"
                    title="Request bulk quote"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-gray-100">
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50">
                <Truck className="w-6 h-6 text-slate-600 mb-2" />
                <span className="text-xs font-bold text-gray-900">Free Shipping</span>
                <span className="text-[10px] text-gray-500">On orders over ₹1000</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50">
                <RotateCcw className="w-6 h-6 text-slate-600 mb-2" />
                <span className="text-xs font-bold text-gray-900">30 Days Return</span>
                <span className="text-[10px] text-gray-500">No questions asked</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50">
                <ShieldCheck className="w-6 h-6 text-slate-600 mb-2" />
                <span className="text-xs font-bold text-gray-900">Secure Payment</span>
                <span className="text-[10px] text-gray-500">100% encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="mt-12 bg-white p-8 rounded-lg shadow-sm border border-gray-100 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
        
        {/* Rating Breakdown */}
        {reviews.length > 0 && (
          <div className="flex flex-col md:flex-row gap-8 mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <div className="flex flex-col items-center justify-center min-w-[150px]">
              <span className="text-5xl font-black text-gray-900">{averageRating}</span>
              <div className="flex my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-500">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingCounts[star];
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-600 w-12">{star} Stars</span>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Write a Review */}
        <form onSubmit={handleReviewSubmit} className="mb-10 bg-gray-50 p-6 rounded-lg">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Write a Review</h3>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                type="button"
                key={star}
                onClick={() => setNewRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star className={`w-6 h-6 ${star <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full bg-white border border-gray-200 rounded-lg p-4 mb-4 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none"
            rows="3"
            required
          />
          <button
            type="submit"
            disabled={submittingReview || !newComment.trim() || newRating === 0}
            className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-gray-900">{review.userName}</span>
                    <div className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mt-2">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
