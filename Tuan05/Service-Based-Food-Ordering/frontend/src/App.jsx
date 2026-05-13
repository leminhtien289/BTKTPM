import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, LogOut, CheckCircle, XCircle } from 'lucide-react';
import './App.css';

const API_GATEWAYS = {
  USER: 'http://localhost:8081',
  FOOD: 'http://localhost:8082',
  ORDER: 'http://localhost:8083',
  PAYMENT: 'http://localhost:8084'
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('login'); // login, foods, cart, order-success
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  useEffect(() => {
    if (token) {
      setView('foods');
      fetchFoods();
    }
  }, [token]);

  const fetchFoods = async () => {
    try {
      const res = await axios.get(`${API_GATEWAYS.FOOD}/foods`);
      setFoods(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_GATEWAYS.USER}/login`, { username, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      alert('Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_GATEWAYS.USER}/register`, { username, password });
      alert('Registered successfully! Now you can login.');
    } catch (err) {
      alert('Registration failed. Username might exist.');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCart([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  };

  const addToCart = (food) => {
    const existing = cart.find(i => i.foodId === food.id);
    if (existing) {
      setCart(cart.map(i => i.foodId === food.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { foodId: food.id, name: food.name, price: food.price, quantity: 1, image: food.image }]);
    }
  };

  const checkout = async () => {
    try {
      const res = await axios.post(`${API_GATEWAYS.ORDER}/orders`, {
        token,
        items: cart.map(i => ({ foodId: i.foodId, quantity: i.quantity }))
      });
      setCurrentOrder(res.data);
      setCart([]);
      setView('checkout');
    } catch (err) {
      alert('Checkout failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const pay = async (method) => {
    try {
      setPaymentStatus('processing');
      const res = await axios.post(`${API_GATEWAYS.PAYMENT}/payments`, {
        orderId: currentOrder.id,
        method
      });
      setCurrentOrder(prev => ({ ...prev, status: 'PAID' }));
      setPaymentStatus('success');
    } catch (err) {
      setCurrentOrder(prev => ({ ...prev, status: 'FAILED' }));
      setPaymentStatus('failed');
    }
  };


  if (view === 'login') {
    return (
      <div className="container login-container">
        <div className="card">
          <h1>🍔 Mini Food Delivery</h1>
          <p className="hint">Admin account: <code>admin / admin</code></p>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <div className="buttons">
              <button type="submit">Login</button>
              <button type="button" onClick={handleRegister} className="btn-secondary">Register</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>🍔 Welcome, {user?.username} {user?.role === 'ADMIN' && <span className="admin-badge">ADMIN</span>}</h1>
        <div className="nav-actions">
          <button onClick={() => setView('foods')} className={view === 'foods' ? 'active' : ''}>Menu</button>
          <button onClick={() => setView('cart')} className={view === 'cart' ? 'active' : ''}>
            <ShoppingCart size={18} /> Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
          </button>
          {user?.role === 'ADMIN' && (
            <button onClick={() => setView('admin')} className={view === 'admin' ? 'active admin-tab' : 'admin-tab'}>
              ⚙️ Manage Foods
            </button>
          )}
          <button onClick={logout} className="btn-logout"><LogOut size={18} /> Logout</button>
        </div>
      </header>

      {view === 'foods' && (
        <div className="food-grid">
          {foods.map(f => (
            <div key={f.id} className="food-card">
              <div className="food-image">{f.image}</div>
              <h3>{f.name}</h3>
              <p>{f.description}</p>
              <div className="price">{f.price.toLocaleString()} VNĐ</div>
              <button onClick={() => addToCart(f)}>Add to Cart</button>
            </div>
          ))}
        </div>
      )}

      {view === 'cart' && (
        <div className="cart-view">
          <h2>Your Cart</h2>
          {cart.length === 0 ? <p>Cart is empty</p> : (
            <div className="cart-items">
              {cart.map(i => (
                <div key={i.foodId} className="cart-item">
                  <span>{i.image} {i.name}</span>
                  <span>x{i.quantity}</span>
                  <span>{(i.price * i.quantity).toLocaleString()} VNĐ</span>
                </div>
              ))}
              <div className="cart-total">
                <strong>Total: {cart.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()} VNĐ</strong>
              </div>
              <button className="btn-checkout" onClick={checkout}>Place Order</button>
            </div>
          )}
        </div>
      )}

      {view === 'admin' && user?.role === 'ADMIN' && (
        <AdminPanel foods={foods} onRefresh={fetchFoods} />
      )}

      {view === 'checkout' && currentOrder && (
        <div className="checkout-view card">
          <h2>Order #{currentOrder.id} Details</h2>
          <p>Total: <strong>{currentOrder.totalPrice.toLocaleString()} VNĐ</strong></p>
          <p>Status: <span className="status badge-pending">{currentOrder.status}</span></p>
          
          {paymentStatus === null && (
            <div className="payment-methods">
              <h3>Select Payment Method:</h3>
              <button onClick={() => pay('COD')}>Cash on Delivery</button>
              <button onClick={() => pay('BANKING')} className="btn-banking">Banking</button>
            </div>
          )}

          {paymentStatus === 'processing' && <p>⏳ Processing payment...</p>}
          
          {paymentStatus === 'success' && (
            <div className="payment-result success">
              <CheckCircle size={48} color="green" />
              <h3>Payment Successful!</h3>
              <p>Your order is confirmed and notification sent.</p>
              <button onClick={() => { setView('foods'); setPaymentStatus(null); }}>Back to Menu</button>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="payment-result failed">
              <XCircle size={48} color="red" />
              <h3>Payment Failed</h3>
              <p>Gateway declined the transaction.</p>
              <button onClick={() => setPaymentStatus(null)}>Try Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Admin Panel Component ───────────────────────────────────────────────────
function AdminPanel({ foods, onRefresh }) {
  const emptyForm = { name: '', price: '', description: '', image: '🍽️' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');

  const FOOD_URL = API_GATEWAYS.FOOD;

  const notify = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price) };
    try {
      if (editingId) {
        await axios.put(`${FOOD_URL}/foods/${editingId}`, payload);
        notify('✅ Food updated!');
      } else {
        await axios.post(`${FOOD_URL}/foods`, payload);
        notify('✅ Food added!');
      }
      setForm(emptyForm);
      setEditingId(null);
      onRefresh();
    } catch (err) {
      notify('❌ Error: ' + err.message);
    }
  };

  const handleEdit = (food) => {
    setEditingId(food.id);
    setForm({ name: food.name, price: String(food.price), description: food.description, image: food.image });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa món "${name}"?`)) return;
    try {
      await axios.delete(`${FOOD_URL}/foods/${id}`);
      notify('✅ Food deleted!');
      onRefresh();
    } catch (err) {
      notify('❌ Error: ' + err.message);
    }
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };

  return (
    <div className="admin-panel">
      <h2>⚙️ Manage Foods <span className="role-tag">ADMIN ONLY</span></h2>

      {/* Form Add / Edit */}
      <div className="card admin-form">
        <h3>{editingId ? `✏️ Edit Food #${editingId}` : '➕ Add New Food'}</h3>
        {msg && <p className="admin-msg">{msg}</p>}
        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label>Tên món ăn *</label>
            <input
              placeholder="VD: Phở Bò"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="admin-field-row">
            <div className="admin-field">
              <label>Giá (VNĐ) *</label>
              <input
                type="number"
                placeholder="VD: 50000"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="admin-field">
              <label>Icon Emoji *</label>
              <input
                placeholder="VD: 🍜"
                value={form.image}
                onChange={e => setForm({ ...form, image: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="admin-field">
            <label>Mô tả</label>
            <input
              placeholder="VD: Phở bò tái nạm đặc biệt"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="buttons">
            <button type="submit">{editingId ? '💾 Update Food' : '➕ Add Food'}</button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* Food list */}
      <div className="admin-food-list">
        {foods.map(f => (
          <div key={f.id} className="admin-food-row">
            <span className="admin-food-icon">{f.image}</span>
            <div className="admin-food-info">
              <strong>{f.name}</strong>
              <span>{f.price.toLocaleString()} VNĐ — {f.description}</span>
            </div>
            <div className="admin-food-actions">
              <button onClick={() => handleEdit(f)} className="btn-edit">✏️ Edit</button>
              <button onClick={() => handleDelete(f.id, f.name)} className="btn-delete">🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
