import { removeFromCart } from '../api';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function CartPanel({ userId, cartItems, onCartUpdate, onCheckout, checkingOut }) {
  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = cartItems.reduce((s, i) => s + i.quantity, 0);

  const handleRemove = async (productId) => {
    const data = await removeFromCart(userId, productId).catch(() => null);
    if (data?.items) onCartUpdate(data.items);
  };

  return (
    <div className="card shadow-sm border-0 sticky-top" style={{ borderRadius: 12, top: '1rem' }}>
      <div
        className="card-header text-white fw-bold border-0"
        style={{ background: '#e53935', borderRadius: '12px 12px 0 0' }}
      >
        🛒 Giỏ hàng{count > 0 && <span className="badge bg-warning text-dark ms-2">{count}</span>}
      </div>

      <div className="card-body p-3" style={{ minHeight: 80 }}>
        {cartItems.length === 0 ? (
          <div className="text-center text-muted py-3">
            <div style={{ fontSize: '2rem' }}>🛒</div>
            <small>Giỏ hàng trống</small>
          </div>
        ) : (
          cartItems.map((item, i) => (
            <div
              key={item.productId}
              className={`d-flex justify-content-between align-items-center py-2${i > 0 ? ' border-top' : ''}`}
            >
              <div>
                <div className="small fw-semibold">{item.name}</div>
                <div className="text-muted" style={{ fontSize: '.75rem' }}>
                  x{item.quantity} × {fmt(item.price)}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-danger small fw-bold">{fmt(item.price * item.quantity)}</span>
                <button
                  className="btn btn-outline-secondary py-0 px-1"
                  style={{ fontSize: '.7rem' }}
                  onClick={() => handleRemove(item.productId)}
                >✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card-footer bg-white border-0 p-3">
        <div className="d-flex justify-content-between fw-bold mb-2">
          <span>Tổng cộng:</span>
          <span style={{ color: '#e53935' }}>{fmt(total)}</span>
        </div>
        <button
          className="btn btn-danger w-100 fw-bold"
          disabled={cartItems.length === 0 || checkingOut}
          onClick={onCheckout}
        >
          {checkingOut
            ? <><span className="spinner-border spinner-border-sm me-1" />Đang xử lý...</>
            : 'Đặt hàng ngay →'}
        </button>
        <small className="text-muted d-block text-center mt-1" style={{ fontSize: '.7rem' }}>
          ⚡ Xử lý trong Data Grid — không qua DB
        </small>
      </div>
    </div>
  );
}
