import { useState, useEffect, useCallback } from 'react';
import ProductGrid from './components/ProductGrid';
import CartPanel from './components/CartPanel';
import OrderModal from './components/OrderModal';
import { getCart, checkout, getApiBase } from './api';

const getUserId = () => {
  let uid = localStorage.getItem('fs_uid');
  if (!uid) {
    uid = 'u_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('fs_uid', uid);
  }
  return uid;
};

export default function App() {
  const [userId]        = useState(getUserId);
  const [cartItems, setCartItems] = useState([]);
  const [order, setOrder]         = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [toasts, setToasts]       = useState([]);

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    getCart(userId).then(d => setCartItems(d.items || [])).catch(() => {});
  }, [userId]);

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const data = await checkout(userId);
      setCartItems([]);
      setOrder(data.order);
      toast('🎉 Đặt hàng thành công!');
    } catch (err) {
      toast('❌ ' + err.message, 'danger');
    } finally {
      setCheckingOut(false);
    }
  };

  const api = getApiBase();

  return (
    <div>
      {/* Flash banner */}
      <div style={{ background: 'linear-gradient(90deg,#e53935,#ff6f00)', color: '#fff', textAlign: 'center', padding: '8px', fontWeight: 600, letterSpacing: 1 }}>
        ⚡ FLASH SALE — Giảm đến 80% — Hàng có hạn, nhanh tay! ⚡
      </div>

      {/* Navbar */}
      <nav className="navbar navbar-dark" style={{ background: '#e53935' }}>
        <div className="container">
          <span className="navbar-brand fw-bold fs-4">🛒 FlashSale</span>
          <small className="text-white-50 d-none d-md-block">Session: {userId}</small>
        </div>
      </nav>

      <div className="container my-4">
        <div className="row g-4">
          <div className="col-lg-8">
            <ProductGrid userId={userId} onCartUpdate={setCartItems} toast={toast} />
          </div>
          <div className="col-lg-4">
            <CartPanel
              userId={userId}
              cartItems={cartItems}
              onCartUpdate={setCartItems}
              onCheckout={handleCheckout}
              checkingOut={checkingOut}
            />

            {/* Architecture info */}
            <div className="card mt-3 border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-2">🏗️ Space-Based Architecture</h6>
                <div className="d-flex flex-column gap-1" style={{ fontSize: '.75rem' }}>
                  <div><span className="badge bg-success me-1">PU1</span>Product <code className="text-muted">{api.product}</code></div>
                  <div><span className="badge bg-warning text-dark me-1">PU2</span>Cart <code className="text-muted">{api.cart}</code></div>
                  <div><span className="badge me-1" style={{ background: '#9c27b0' }}>PU3</span>Order <code className="text-muted">{api.order}</code></div>
                  <div><span className="badge bg-info me-1">PU4</span>Inventory <code className="text-muted">{api.inventory}</code></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order success modal */}
      {order && <OrderModal order={order} onClose={() => setOrder(null)} />}

      {/* Toast notifications */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast show align-items-center text-white bg-${t.type} border-0 mb-2`} role="alert">
            <div className="toast-body">{t.msg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
