import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { LogOut, Map, CreditCard, CheckCircle, Info } from 'lucide-react';

const ORCHESTRATOR_URL = 'http://localhost:8080';
const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function App() {
  const [user, setUser] = useState(null);
  const [tours, setTours] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login Form
  const [username, setUsername] = useState('demoUser');

  useEffect(() => {
    if (user) {
      fetchTours();
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Chỉ gọi Orchestrator!
      const res = await fetch(`${ORCHESTRATOR_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Lỗi kết nối Orchestrator');
    }
    setLoading(false);
  };

  const fetchTours = async () => {
    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/tours`);
      const data = await res.json();
      setTours(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookTour = async (tour) => {
    setLoading(true);
    setError('');
    setBooking(null);
    try {
      // Gọi Orchestrator, nó sẽ tự động trigger 4 services khác
      const res = await fetch(`${ORCHESTRATOR_URL}/book-tour`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tourId: tour.id,
          quantity: 1 // hardcode 1 vé cho đơn giản
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setBooking(data);
      } else {
        setError(data.error || 'Đặt tour thất bại');
      }
    } catch (err) {
      setError('Lỗi kết nối đến Orchestrator Service');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="card shadow-sm p-4" style={{ width: 400 }}>
          <h4 className="text-center mb-4 text-primary fw-bold">✈️ Travel Booking SOA</h4>
          <p className="text-muted text-center small mb-3">Orchestration-Driven SOA</p>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label text-muted">Username (có sẵn: demoUser)</label>
              <input 
                type="text" 
                className="form-control form-control-lg" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>
            <button className="btn btn-primary w-100 btn-lg fw-bold" type="submit" disabled={loading}>
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 pb-5">
      <nav className="navbar navbar-dark bg-primary shadow-sm mb-4">
        <div className="container">
          <span className="navbar-brand mb-0 h1 fw-bold d-flex align-items-center gap-2">
            <Map size={24}/> Orchestration SOA Travel
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-light">Xin chào, <strong>{user.name}</strong></span>
            <button className="btn btn-sm btn-outline-light d-flex align-items-center gap-1" onClick={() => setUser(null)}>
              <LogOut size={16}/> Thoát
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row g-4">
          <div className="col-lg-8">
            <h5 className="fw-bold mb-3">🏝️ Danh sách Tour</h5>
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="row g-3">
              {tours.map(tour => (
                <div key={tour.id} className="col-md-6">
                  <div className="card h-100 shadow-sm border-0" style={{ borderRadius: 12 }}>
                    <div className="card-body text-center p-4">
                      <div style={{ fontSize: '4rem', lineHeight: 1 }} className="mb-3">{tour.image}</div>
                      <h5 className="fw-bold">{tour.name}</h5>
                      <p className="text-primary fw-bold fs-5 mb-2">{fmt(tour.price)}</p>
                      <p className="text-muted small">Số chỗ còn nhận: {tour.available}</p>
                      <button 
                        className="btn btn-primary w-100 fw-bold"
                        onClick={() => handleBookTour(tour)}
                        disabled={loading}
                      >
                        {loading ? 'Đang xử lý...' : 'Đặt tour ngay'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: '1.5rem', borderRadius: 12 }}>
              <div className="card-header bg-white border-0 pt-4 pb-0">
                <h6 className="fw-bold mb-0">🏗️ Kiến trúc Orchestrator</h6>
              </div>
              <div className="card-body">
                <p className="text-muted small mb-3">
                  Trang web này <strong>không hề biết</strong> đến User Service, Tour Service, Booking hay Payment. Nó <strong>chỉ gọi duy nhất Orchestrator Service</strong> ở port <code>8080</code>.
                </p>
                <div className="d-flex flex-column gap-2 small">
                  <div className="bg-light p-2 rounded">1. 🌐 Frontend gọi <code>8080</code></div>
                  <div className="bg-light p-2 rounded">2. ⚙️ Orchestrator gọi <code>User (:8081)</code></div>
                  <div className="bg-light p-2 rounded">3. ⚙️ Orchestrator gọi <code>Tour (:8082)</code></div>
                  <div className="bg-light p-2 rounded">4. ⚙️ Orchestrator gọi <code>Booking (:8083)</code></div>
                  <div className="bg-light p-2 rounded">5. ⚙️ Orchestrator gọi <code>Payment (:8084)</code></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {booking && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
                <div className="modal-header bg-success text-white border-0" style={{ borderRadius: '16px 16px 0 0' }}>
                  <h5 className="modal-title d-flex align-items-center gap-2"><CheckCircle/> Đặt Tour Thành Công!</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setBooking(null)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="alert alert-success bg-opacity-10 border-success border-opacity-25 py-2 mb-4 text-center">
                    <small className="d-block text-success fw-bold">MÃ GIAO DỊCH</small>
                    <code>{booking.transaction}</code>
                  </div>
                  
                  <div className="mb-3 d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Khách hàng:</span>
                    <span className="fw-bold">{booking.user}</span>
                  </div>
                  <div className="mb-3 d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Tên Tour:</span>
                    <span className="fw-bold">{booking.tour}</span>
                  </div>
                  <div className="mb-3 d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Số lượng vé:</span>
                    <span className="fw-bold">{booking.booking.quantity}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-2">
                    <span className="text-muted fs-5">Tổng tiền:</span>
                    <span className="fw-bold text-success fs-4">{fmt(booking.booking.totalAmount)}</span>
                  </div>
                </div>
                <div className="modal-footer border-0 pb-4 pt-0 justify-content-center">
                  <button type="button" className="btn btn-success px-5 py-2 fw-bold" onClick={() => setBooking(null)}>Tuyệt vời!</button>
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
