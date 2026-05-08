import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Package, DollarSign, Tag, Image as ImageIcon, LayoutDashboard, AlertTriangle } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../AuthContext.jsx';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export const Admin = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    stock: 0
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [orderDeleteId, setOrderDeleteId] = useState(null);
  const [userDeleteId, setUserDeleteId] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchOtherData = async () => {
      try {
        const [ords, usrs, lgs] = await Promise.all([
          api.getOrders(),
          api.getUsers(),
          api.getLogs()
        ]);
        setOrders(ords);
        setUsers(usrs);
        setLogs(lgs);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load dashboard data');
      }
    };

    fetchOtherData();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchProducts = async () => {
      try {
        const prods = await api.getProducts(page, limit);
        setProducts(prods.products || []);
        setTotalPages(prods.totalPages || 1);
      } catch (error) {
        toast.error('Failed to load products');
      }
    };

    fetchProducts();
  }, [isAdmin, page]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const updated = await api.updateProduct(editingProduct.id, newProduct);
        setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
        toast.success('Product updated successfully');
        setEditingProduct(null);
      } else {
        const added = await api.addProduct(newProduct);
        setProducts([added, ...products]);
        toast.success('Product added successfully');
      }
      setIsAdding(false);
      setNewProduct({ name: '', description: '', price: 0, category: '', image: '', stock: 0 });
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, deliveryTime) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus, deliveryTime);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: updated.status, deliveryTime: updated.deliveryTime } : o));
      toast.success(`Order updated successfully`);
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await api.deleteOrder(orderId);
      setOrders(orders.filter(o => o.id !== orderId));
      toast.success('Order deleted');
      setOrderDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted');
      setUserDeleteId(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  if (authLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div></div>;

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-slate-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center">
          <LayoutDashboard className="mr-4 w-10 h-10 text-slate-600" />
          Admin Dashboard
        </h1>
        <button 
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              setEditingProduct(null);
              setNewProduct({ name: '', description: '', price: 0, category: '', image: '', stock: 0 });
            } else {
              setIsAdding(true);
            }
          }}
          className="bg-slate-600 text-white px-6 py-3 rounded-lg font-bold flex items-center hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
        >
          <Plus className="mr-2 w-5 h-5" />
          {isAdding ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-lg border border-slate-200 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-600 transition-all">
                <Package className="ml-4 text-slate-400 w-5 h-5 flex-shrink-0" />
                <input
                  required
                  type="text"
                  placeholder="Product Name"
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-600 transition-all">
                <Tag className="ml-4 text-slate-400 w-5 h-5 flex-shrink-0" />
                <input
                  required
                  type="text"
                  placeholder="Category"
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400"
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                />
              </div>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-600 transition-all">
                <DollarSign className="ml-4 text-slate-400 w-5 h-5 flex-shrink-0" />
                <input
                  required
                  type="number"
                  placeholder="Price"
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400"
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-600 transition-all">
                <ImageIcon className="ml-4 text-slate-400 w-5 h-5 flex-shrink-0" />
                <input
                  required
                  type="url"
                  placeholder="Image URL"
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400"
                  value={newProduct.image}
                  onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                />
              </div>
              <textarea
                required
                placeholder="Description"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-600 transition-all h-32"
                value={newProduct.description}
                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-slate-600 text-white py-4 rounded-lg font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-200">
                Save Product
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="flex space-x-4 border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-4 px-4 font-bold transition-all ${activeTab === 'inventory' ? 'text-slate-600 border-b-2 border-slate-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 px-4 font-bold transition-all ${activeTab === 'orders' ? 'text-slate-600 border-b-2 border-slate-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-4 font-bold transition-all ${activeTab === 'users' ? 'text-slate-600 border-b-2 border-slate-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-4 px-4 font-bold transition-all ${activeTab === 'logs' ? 'text-slate-600 border-b-2 border-slate-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Security Logs
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover mr-3" referrerPolicy="no-referrer" />
                        <span className="font-medium text-slate-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{product.category}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{product.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditClick(product)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        {deleteConfirmId === product.id ? (
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-300 bg-white rounded text-sm disabled:opacity-50 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600 font-medium">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                disabled={page >= totalPages}
                className="px-4 py-2 border border-slate-300 bg-white rounded text-sm disabled:opacity-50 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Order #{String(order.id).slice(-6)}</p>
                  <p className="text-sm font-bold text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500 mb-1">User: {order.user?.displayName || 'Unknown'}</p>
                  <p className="text-xs text-slate-500 mb-1">Email: {order.user?.email || 'N/A'}</p>
                  <span className="text-sm font-bold text-slate-900">Address </span>
                  <p className="text-xs text-slate-500 mb-1">{order.shippingAddress}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    order.status === 'paid' ? 'bg-green-100 text-green-700' : 
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {order.status}
                  </span>
                  <select 
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                    className="text-[10px] border border-slate-200 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-slate-600"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <input 
                    type="text"
                    placeholder="Delivery Time (e.g. 27 Mar)"
                    defaultValue={order.deliveryTime || ''}
                    onBlur={(e) => handleUpdateOrderStatus(order.id, order.status, e.target.value)}
                    className="text-[10px] border border-slate-200 rounded-lg p-1 w-full mt-1 focus:outline-none focus:ring-1 focus:ring-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                  <p key={idx} className="text-xs text-slate-600">{item.name} x {item.quantity}</p>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-sm text-slate-500">Total</span>
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-bold text-slate-600">₹{order.total.toFixed(2)}</span>
                  {orderDeleteId === order.id ? (
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="bg-red-600 text-white text-[10px] px-2 py-1 rounded hover:bg-red-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setOrderDeleteId(null)}
                        className="bg-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setOrderDeleteId(order.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{u.displayName}</td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${u.role === 'admin' ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {userDeleteId === u.id ? (
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="bg-red-600 text-white text-[10px] px-2 py-1 rounded hover:bg-red-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setUserDeleteId(null)}
                          className="bg-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded hover:bg-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setUserDeleteId(u.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete User"
                        disabled={u.role === 'admin' && u.email === 'admin@nexus.com'} // Basic protection
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Path</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map(log => (
                  <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${log.suspicious ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${log.status < 400 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <span className="text-slate-400 mr-2">{log.method}</span>
                      {log.path}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{log.ip}</td>
                    <td className="px-6 py-4">
                      {log.suspicious ? (
                        <div className="flex items-center text-red-600 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {log.reason}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Normal</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
