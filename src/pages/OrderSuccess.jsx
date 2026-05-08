import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state;

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-10">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-slate-100 text-slate-600">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Thank you for your order!</h1>
          <p className="text-slate-600 max-w-2xl">
            Your payment was successful and your order is being processed. We appreciate your purchase.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
            {order ? (
              <>
                <p className="text-sm text-slate-500 mb-2">Order ID</p>
                <p className="text-lg font-bold text-slate-900 break-words">{order.id}</p>
                <p className="mt-4 text-sm text-slate-500 mb-2">Shipping Address</p>
                <p className="text-slate-700">{order.shippingAddress}</p>
                <p className="mt-4 text-sm text-slate-500 mb-2">Total Paid</p>
                <p className="text-xl font-bold text-slate-600">₹{order.total.toFixed(2)}</p>
              </>
            ) : (
              <p className="text-slate-600">No order details available. Please check your orders page or return to the shop.</p>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Items Ordered</h2>
            {order?.items?.length ? (
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">No items available for this order.</p>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row sm:justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center rounded-lg bg-slate-600 px-6 py-3 text-white font-semibold hover:bg-slate-700 transition"
          >
            Continue Shopping
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-6 py-3 text-slate-700 font-semibold hover:bg-slate-50 transition"
          >
            View My Orders
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="mt-6 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </button>
      </div>
    </div>
  );
};
