import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { ShoppingCart, Package, CreditCard, LogOut, CheckCircle, Store } from 'lucide-react';

const API = {
  USER: 'http://localhost:8081',
  PRODUCT: 'http://localhost:8082',
  CART: 'http://localhost:8083',
  ORDER: 'http://localhost:8084',
  PAYMENT: 'http://localhost:8085'
};

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderModal, setOrderModal] = useState(null);
  const [view, setView] = useState('shop'); // 'shop', 'cart'

  // Login
  const [username, setUsername] = useState('demoUser');
  const [password, setPassword] = useState('demo123');

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCart();
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API.USER}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) setUser(data.user);
      else setError(data.error);
    } catch (err) {
      setError('Lỗi kết nối User Service :8081');
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API.PRODUCT}/products`);
      setProducts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API.CART}/cart/${user.id}`);
      const data = await res.json();
      setCart(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = async (productId) => {
    try {
      await fetch(`${API.CART}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId, quantity: 1 })
      });
      fetchCart();
    } catch (err) {
      alert('Lỗi gọi Cart Service :8083');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await fetch(`${API.CART}/item`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId })
      });
      fetchCart();
    } catch (err) {
      alert('Lỗi gọi Cart Service :8083');
    }
  };

  const checkout = async () => {
    setLoading(true);
    try {
      // Gọi Order Service
      const res = await fetch(`${API.ORDER}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      
      if (data.success) {
        setCart([]); // Cập nhật UI vì order service đã gọi cart service để xóa DB
        setOrderModal(data.order);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Lỗi gọi Order Service :8084');
    }
    setLoading(false);
  };

  const processPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API.PAYMENT}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderModal.id, amount: orderModal.totalAmount })
      });
      const data = await res.json();
      
      if (data.success) {
        setOrderModal({ ...orderModal, status: 'PAID', transactionId: data.transactionId });
      } else {
        alert('Thanh toán thất bại: ' + data.error);
        setOrderModal({ ...orderModal, status: 'PAYMENT_FAILED' });
      }
    } catch (err) {
      alert('Lỗi gọi Payment Service :8085');
    }
    setLoading(false);
  };

  const getCartDetails = () => {
    return cart.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return { ...item, ...prod };
    }).filter(i => i.name);
  };

  if (!user) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="card shadow border-0 p-4" style={{ width: 400, borderRadius: 16 }}>
          <div className="text-center mb-4">
            <Store size={48} className="text-warning mb-2" />
            <h4 className="fw-bold">Shopee Mini</h4>
            <p className="text-muted small">Microservices Architecture</p>
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-bold">Username</label>
              <input type="text" className="form-control bg-light" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted small fw-bold">Password</label>
              <input type="password" className="form-control bg-light" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-warning w-100 fw-bold" type="submit" disabled={loading}>
              {loading ? 'Đang gọi User Service (:8081)...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const cartDetails = getCartDetails();
  const cartTotalAmount = cartDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm mb-4" style={{ background: '#ee4d2d' }}>
        <div className="container">
          <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="#" onClick={() => setView('shop')}>
            <Store size={24}/> Shopee Mini
          </a>
          <div className="d-flex align-items-center gap-4">
            <button className="btn btn-link text-white text-decoration-none p-0 position-relative" onClick={() => setView('cart')}>
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-white text-danger">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
            <div className="text-white small d-none d-md-block">
              👤 {user.name}
            </div>
            <button className="btn btn-sm btn-outline-light d-flex align-items-center gap-1" onClick={() => setUser(null)}>
              <LogOut size={16}/> Thoát
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          {/* Main Content */}
          <div className="col-lg-9 mb-4">
            {view === 'shop' ? (
              <>
                <h5 className="fw-bold mb-3 d-flex justify-content-between align-items-center">
                  <span>🛍️ Danh sách sản phẩm</span>
                  <span className="badge bg-secondary">Product Service (:8082)</span>
                </h5>
                <div className="row g-3">
                  {products.map(p => (
                    <div key={p.id} className="col-md-4 col-sm-6">
                      <div className="card h-100 shadow-sm border-0" style={{ borderRadius: 12 }}>
                        <div className="card-body text-center p-3 d-flex flex-column">
                          <div style={{ fontSize: '4rem', lineHeight: 1 }} className="mb-2">{p.image}</div>
                          <h6 className="fw-bold mb-1 text-truncate">{p.name}</h6>
                          <p className="text-muted small mb-2" style={{ height: 40, overflow: 'hidden' }}>{p.description}</p>
                          <div className="mt-auto">
                            <p className="text-danger fw-bold mb-2">{fmt(p.price)}</p>
                            <button 
                              className="btn btn-outline-danger w-100 btn-sm fw-bold"
                              onClick={() => addToCart(p.id)}
                            >
                              Thêm vào giỏ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h5 className="fw-bold mb-3 d-flex justify-content-between align-items-center">
                  <span>🛒 Giỏ hàng của bạn</span>
                  <span className="badge bg-secondary">Cart Service (:8083)</span>
                </h5>
                <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
                  <div className="card-body p-0">
                    {cartDetails.length === 0 ? (
                      <div className="p-5 text-center text-muted">Giỏ hàng trống</div>
                    ) : (
                      <table className="table mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th className="ps-4">Sản phẩm</th>
                            <th className="text-center">Đơn giá</th>
                            <th className="text-center">Số lượng</th>
                            <th className="text-end">Thành tiền</th>
                            <th className="text-center pe-4">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cartDetails.map(item => (
                            <tr key={item.productId}>
                              <td className="ps-4">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="fs-3">{item.image}</span>
                                  <span className="fw-semibold">{item.name}</span>
                                </div>
                              </td>
                              <td className="text-center text-muted">{fmt(item.price)}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-end text-danger fw-bold">{fmt(item.price * item.quantity)}</td>
                              <td className="text-center pe-4">
                                <button className="btn btn-sm btn-light text-danger" onClick={() => removeFromCart(item.productId)}>Xóa</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {cartDetails.length > 0 && (
                    <div className="card-footer bg-white border-top-0 p-4 d-flex justify-content-between align-items-center" style={{ borderRadius: '0 0 12px 12px' }}>
                      <span className="fs-5">Tổng thanh toán: <strong className="text-danger fs-4 ms-2">{fmt(cartTotalAmount)}</strong></span>
                      <button className="btn btn-danger btn-lg fw-bold px-5" onClick={checkout} disabled={loading}>
                        {loading ? 'Đang tạo đơn...' : 'Mua hàng'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Microservices Architecture Panel */}
          <div className="col-lg-3">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: '1.5rem', borderRadius: 12 }}>
              <div className="card-header bg-dark text-white border-0 pt-3 pb-2" style={{ borderRadius: '12px 12px 0 0' }}>
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2"><Package size={18}/> Kiến trúc Hệ thống</h6>
              </div>
              <div className="card-body bg-light">
                <p className="text-muted small mb-3">
                  Frontend gọi API trực tiếp đến 5 Microservices riêng biệt (không dùng API Gateway hay Orchestrator).
                </p>
                <div className="d-flex flex-column gap-2 small fw-semibold">
                  <div className="bg-white p-2 rounded border-start border-4 border-success d-flex justify-content-between">
                    <span>User Service</span> <code className="text-muted">:8081</code>
                  </div>
                  <div className="bg-white p-2 rounded border-start border-4 border-warning d-flex justify-content-between">
                    <span>Product Service</span> <code className="text-muted">:8082</code>
                  </div>
                  <div className="bg-white p-2 rounded border-start border-4 border-primary d-flex justify-content-between">
                    <span>Cart Service</span> <code className="text-muted">:8083</code>
                  </div>
                  <div className="bg-white p-2 rounded border-start border-4 border-danger d-flex justify-content-between">
                    <span>Order Service</span> <code className="text-muted">:8084</code>
                  </div>
                  <div className="bg-white p-2 rounded border-start border-4 border-info d-flex justify-content-between">
                    <span>Payment Service</span> <code className="text-muted">:8085</code>
                  </div>
                </div>
                <hr/>
                <small className="text-muted d-block lh-sm">
                  🔹 <strong>Nguyên tắc:</strong> Mỗi Service quản lý một Database riêng biệt (users.db, products.db, cart.db, orders.db, payments.db). Tuyệt đối không query chéo DB.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order & Payment Modal */}
      {orderModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
                
                {/* Header changes color based on status */}
                <div className={`modal-header text-white border-0 ${orderModal.status === 'PAID' ? 'bg-success' : orderModal.status === 'PAYMENT_FAILED' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ borderRadius: '16px 16px 0 0' }}>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                    {orderModal.status === 'PAID' ? <><CheckCircle/> Thanh toán thành công</> : 
                     orderModal.status === 'PAYMENT_FAILED' ? '❌ Thanh toán thất bại' : 
                     <><CreditCard/> Thanh toán đơn hàng</>}
                  </h5>
                  {orderModal.status !== 'PENDING' && (
                    <button type="button" className="btn-close btn-close-white" onClick={() => { setOrderModal(null); setView('shop'); }}></button>
                  )}
                </div>

                <div className="modal-body p-4">
                  <div className="text-center mb-4">
                    <p className="text-muted small mb-1">Mã đơn hàng (Order Service :8084)</p>
                    <code className="fs-6 bg-light px-3 py-1 rounded">{orderModal.id}</code>
                  </div>
                  
                  <div className="bg-light p-3 rounded mb-4">
                    {orderModal.items.map(i => (
                      <div key={i.productId} className="d-flex justify-content-between mb-1 small">
                        <span>{i.productName} <span className="text-muted">x{i.quantity}</span></span>
                        <span className="fw-semibold">{fmt(i.price * i.quantity)}</span>
                      </div>
                    ))}
                    <hr className="my-2"/>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">Tổng thanh toán:</span>
                      <span className="fs-4 fw-bold text-danger">{fmt(orderModal.totalAmount)}</span>
                    </div>
                  </div>

                  {orderModal.status === 'PENDING' && (
                    <button 
                      className="btn btn-warning w-100 btn-lg fw-bold shadow-sm" 
                      onClick={processPayment}
                      disabled={loading}
                    >
                      {loading ? 'Đang gọi Payment Service :8085...' : 'Xác nhận thanh toán ngay'}
                    </button>
                  )}

                  {orderModal.status === 'PAID' && (
                    <div className="alert alert-success text-center py-2 mb-0 border-0">
                      <small className="d-block mb-1">Mã giao dịch (Payment Service :8085)</small>
                      <strong>{orderModal.transactionId}</strong>
                    </div>
                  )}

                  {orderModal.status === 'PAYMENT_FAILED' && (
                    <button className="btn btn-danger w-100 fw-bold" onClick={() => setOrderModal(null)}>Đóng</button>
                  )}

                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
