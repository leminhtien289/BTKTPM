import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { Utensils, CheckCircle, Bell, ShoppingBag, LogOut } from 'lucide-react';

const GATEWAY = 'http://localhost:8080';
const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function App() {
  const [user, setUser] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [username, setUsername] = useState('demoUser');

  useEffect(() => {
    if (user) {
      fetchFoods();
      fetchOrders();
      // Setup a basic polling to simulate real-time notification from Notification Service
      const interval = setInterval(fetchOrders, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${GATEWAY}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) setUser(data.user);
      else setError(data.error);
    } catch (err) {
      setError('Lỗi kết nối API Gateway :8080');
    }
    setLoading(false);
  };

  const fetchFoods = async () => {
    try {
      const res = await fetch(`${GATEWAY}/api/foods`);
      setFoods(await res.json());
    } catch (err) {
      console.error('Lỗi tải danh sách món');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${GATEWAY}/api/orders`);
      setOrders(await res.json());
    } catch (err) {}
  };

  const placeOrder = async (food) => {
    setLoading(true);
    try {
      await fetch(`${GATEWAY}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, foodId: food.id, price: food.price })
      });
      // Refresh order list immediately to see the PENDING order
      fetchOrders();
    } catch (err) {
      alert('Lỗi khi đặt hàng qua API Gateway');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="card shadow-sm p-4" style={{ width: 400, borderRadius: 16 }}>
          <div className="text-center mb-4 text-success">
            <Utensils size={48} className="mb-2" />
            <h4 className="fw-bold text-dark">GrabFood Mini</h4>
            <p className="text-muted small">Hybrid Architecture (Microservices + Event)</p>
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-bold">Username</label>
              <input type="text" className="form-control form-control-lg bg-light" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <button className="btn btn-success w-100 btn-lg fw-bold" type="submit" disabled={loading}>
              {loading ? 'Đang kết nối API Gateway...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-success shadow-sm mb-4">
        <div className="container">
          <span className="navbar-brand fw-bold d-flex align-items-center gap-2">
            <Utensils size={24}/> GrabFood Mini
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white small">👤 {user.name}</span>
            <button className="btn btn-sm btn-outline-light d-flex align-items-center gap-1" onClick={() => setUser(null)}>
              <LogOut size={16}/> Thoát
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row g-4">
          
          {/* Menu Món ăn */}
          <div className="col-lg-7">
            <h5 className="fw-bold mb-3 d-flex justify-content-between align-items-center">
              <span>🍔 Menu Quán</span>
              <span className="badge bg-secondary">Gọi qua API Gateway :8080</span>
            </h5>
            <div className="row g-3">
              {foods.map(food => (
                <div key={food.id} className="col-md-6">
                  <div className="card shadow-sm border-0 h-100" style={{ borderRadius: 12 }}>
                    <div className="card-body text-center p-4">
                      <div style={{ fontSize: '4rem', lineHeight: 1 }} className="mb-2">{food.image}</div>
                      <h5 className="fw-bold">{food.name}</h5>
                      <p className="text-success fw-bold fs-5 mb-3">{fmt(food.price)}</p>
                      <button 
                        className="btn btn-success w-100 fw-bold"
                        onClick={() => placeOrder(food)}
                        disabled={loading}
                      >
                        Đặt món ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Lịch sử + Kiến trúc */}
          <div className="col-lg-5">
            
            {/* Lịch sử đặt hàng */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <div className="card-header bg-white border-0 pt-3 pb-2 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2"><ShoppingBag size={18}/> Đơn hàng của bạn</h6>
                <span className="badge bg-light text-dark border">Polling 3s</span>
              </div>
              <div className="card-body p-0">
                {orders.length === 0 ? (
                  <div className="p-4 text-center text-muted small">Chưa có đơn hàng nào</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {orders.slice().reverse().map(order => {
                      const food = foods.find(f => f.id === order.foodId);
                      return (
                        <li key={order.id} className="list-group-item p-3 border-0 border-bottom">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold">{food?.image} {food?.name}</span>
                            <span className="text-success fw-bold">{fmt(order.price)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>ID: {order.id.split('-')[0]}...</small>
                            {order.status === 'PENDING' && <span className="badge bg-warning text-dark">Chờ thanh toán...</span>}
                            {order.status === 'PAID' && <span className="badge bg-success d-flex align-items-center gap-1"><CheckCircle size={12}/> Đã thanh toán</span>}
                            {order.status === 'PAYMENT_FAILED' && <span className="badge bg-danger">Thanh toán lỗi</span>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Thông báo kiến trúc */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-header bg-dark text-white border-0 pt-3 pb-2" style={{ borderRadius: '12px 12px 0 0' }}>
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2"><Bell size={18}/> Event-Driven Architecture</h6>
              </div>
              <div className="card-body bg-light">
                <p className="text-muted small mb-3">
                  Khi bạn bấm <strong>"Đặt món ngay"</strong>, quá trình sau diễn ra:
                </p>
                <div className="d-flex flex-column gap-2 small">
                  <div className="bg-white p-2 rounded border-start border-4 border-success">
                    1. <strong>REST (Sync):</strong> Tạo order nhanh chóng, trả về kết quả PENDING ngay lập tức.
                  </div>
                  <div className="bg-white p-2 rounded border-start border-4 border-warning">
                    2. <strong>Event (Async):</strong> Order Service bắn ra Event <code>ORDER_CREATED</code> lên Message Broker (MQTT).
                  </div>
                  <div className="bg-white p-2 rounded border-start border-4 border-danger">
                    3. <strong>Worker:</strong> Payment Service bắt event, xử lý thanh toán (giả lập mất 2s), rồi bắn tiếp event <code>PAYMENT_SUCCESS</code>.
                  </div>
                </div>
                <hr/>
                <small className="text-muted d-block text-center">
                  Nhờ Event, hệ thống không bị "đơ" 2s chờ thanh toán. Bạn nhận được phản hồi ngay lập tức!
                </small>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
