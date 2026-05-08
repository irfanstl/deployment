const API_URL = '/api';

export const api = {
  getToken: () => localStorage.getItem('nexus_token'),
  setToken: (token) => localStorage.setItem('nexus_token', token),
  clearToken: () => localStorage.removeItem('nexus_token'),

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await window.fetch(`${API_URL}${endpoint}`, { ...options, headers });

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      // Only throw if response is not ok, or if it's completely empty on a 200 OK.
      if (!response.ok) throw new Error(text || 'Something went wrong');
      return text;
    }

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    return data;
  },

  // Auth
  login: (credentials) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (user) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(user) }),
  requestOtp: (data) => api.request('/auth/request-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (email, otp) => api.request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  completeSignup: (data) => api.request('/auth/complete-signup', { method: 'POST', body: JSON.stringify(data) }),

  // Products
  getProducts: (page = 1, limit = 20) => api.request(`/products?page=${page}&limit=${limit}`),
  getHomepageProducts: () => api.request('/products/homepage'),
  searchProducts: (query) => api.request(`/products/search?q=${encodeURIComponent(query)}`),
  getProduct: (id) => api.request(`/products/${id}`),
  getProductBySku: (sku) => api.request(`/products/sku/${encodeURIComponent(sku)}`),
  getProductReviews: (id) => api.request(`/products/${id}/reviews`),
  addProductReview: (id, review) => api.request(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(review) }),
  addProduct: (product) => api.request('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id, product) => api.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (id) => api.request(`/products/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: () => api.request('/orders'),
  createOrder: (order) => api.request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  updateOrderStatus: (id, status, deliveryTime) => api.request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, deliveryTime }) }),
  deleteOrder: (id) => api.request(`/orders/${id}`, { method: 'DELETE' }),
  submitRfq: (data) => api.request('/rfq', { method: 'POST', body: JSON.stringify(data) }),

  // Razorpay
  createRazorpayOrder: (amount) => api.request('/razorpay/order', { method: 'POST', body: JSON.stringify({ amount }) }),
  verifyRazorpayPayment: (data) => api.request('/razorpay/verify', { method: 'POST', body: JSON.stringify(data) }),

  // User
  getProfile: () => api.request('/auth/profile'),
  updateProfile: (profile) => api.request('/users/profile', { method: 'PUT', body: JSON.stringify(profile) }),

  // Admin
  getUsers: () => api.request('/admin/users'),
  deleteUser: (id) => api.request(`/admin/users/${id}`, { method: 'DELETE' }),
  getLogs: () => api.request('/admin/logs'),
};
