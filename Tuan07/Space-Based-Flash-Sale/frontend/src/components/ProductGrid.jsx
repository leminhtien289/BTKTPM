import { useState, useEffect } from 'react';
import { getProducts, getAllStock, addToCart } from '../api';

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function ProductGrid({ userId, onCartUpdate, toast }) {
  const [products, setProducts] = useState([]);
  const [stocks, setStocks]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [prods, stks] = await Promise.all([getProducts(), getAllStock()]);
      setProducts(prods);
      setStocks(stks);
    } catch {
      toast('❌ Không tải được sản phẩm — kiểm tra PU1 & PU4', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (p) => {
    setAdding(prev => ({ ...prev, [p.id]: true }));
    try {
      const data = await addToCart(userId, { productId: p.id, name: p.name, price: p.price });
      if (data.items) {
        onCartUpdate(data.items);
        toast('✅ Đã thêm vào giỏ hàng!');
      } else {
        toast('❌ ' + (data.error || 'Lỗi'), 'danger');
      }
    } catch {
      toast('❌ Không kết nối được PU2-Cart', 'danger');
    } finally {
      setAdding(prev => ({ ...prev, [p.id]: false }));
    }
  };

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-danger" />
      <p className="mt-2 text-muted">Đang tải từ Redis Data Grid...</p>
    </div>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">🔥 Sản phẩm Flash Sale</h5>
        <button className="btn btn-outline-secondary btn-sm" onClick={load}>↻ Làm mới</button>
      </div>

      {products.length === 0 && (
        <div className="alert alert-warning">Không có sản phẩm. Hãy chạy Data Grid (seed) trước.</div>
      )}

      <div className="row g-3">
        {products.map(p => {
          const stock = stocks[p.id] ?? 0;
          const out   = stock === 0;
          const low   = !out && stock <= 5;
          return (
            <div key={p.id} className="col-sm-6">
              <div
                className={`card h-100 shadow-sm border-0${out ? ' opacity-50' : ''}`}
                style={{ borderRadius: 12, transition: 'transform .15s' }}
                onMouseEnter={e => { if (!out) e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                <div className="card-body d-flex flex-column align-items-center text-center p-3">
                  <div style={{ fontSize: '3.5rem', lineHeight: 1 }} className="mb-2">{p.image || '📦'}</div>
                  <h6 className="fw-bold mb-1">{p.name}</h6>
                  <p className="text-muted small mb-2 flex-grow-1">{p.description}</p>
                  <div className="w-100 d-flex justify-content-between align-items-center mb-2">
                    <span style={{ color: '#e53935', fontWeight: 700, fontSize: '1.1rem' }}>{fmt(p.price)}</span>
                    <span
                      className={`badge ${out ? 'bg-secondary' : low ? 'bg-warning text-dark' : 'bg-success'}`}
                      style={{ fontSize: '.7rem' }}
                    >
                      {out ? 'Hết hàng' : `Còn: ${stock}`}
                    </span>
                  </div>
                  <button
                    className="btn btn-danger btn-sm w-100"
                    disabled={out || adding[p.id]}
                    onClick={() => handleAdd(p)}
                  >
                    {adding[p.id] ? '...' : out ? '— Hết hàng —' : '＋ Thêm vào giỏ'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
