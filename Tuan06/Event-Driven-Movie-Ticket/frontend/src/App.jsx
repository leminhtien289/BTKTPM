import { useState, useEffect } from 'react';
import axios from 'axios';
import { Film, User, Ticket, CheckCircle, XCircle } from 'lucide-react';
import './App.css';

// ✅ Frontend chỉ biết 1 địa chỉ duy nhất: Booking Service (port 8083)
// Booking Service hoạt động như Gateway proxy đến User Service và Movie Service
const GATEWAY = 'http://localhost:8083';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [movies, setMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [view, setView] = useState('login'); // login, movies, booking, status
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // State khi đang đặt vé
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    if (user) {
      setView('movies');
      fetchMovies();
      fetchBookings();
    }
  }, [user]);

  // Tự động fetch lại bookings mỗi 3s để cập nhật trạng thái PAID / FAILED từ broker
  useEffect(() => {
    let interval;
    if (user && view === 'status') {
      interval = setInterval(fetchBookings, 3000);
    }
    return () => clearInterval(interval);
  }, [user, view]);

  const fetchMovies = async () => {
    try {
      const res = await axios.get(`${GATEWAY}/movies`);
      setMovies(res.data);
    } catch(e) {}
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${GATEWAY}/bookings/${user.id}`);
      setBookings(res.data);
    } catch(e) {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${GATEWAY}/auth/login`, { username, password });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      alert('Login failed!');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${GATEWAY}/auth/register`, { username, password });
      alert('Registered successfully! Event USER_REGISTERED published to RabbitMQ! Login now.');
    } catch (err) {
      alert('Registration failed.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setView('login');
  };

  const startBooking = (movie) => {
    setSelectedMovie(movie);
    setSelectedSeats([]);
    setView('booking');
  };

  const toggleSeat = (seat) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const submitBooking = async () => {
    if (selectedSeats.length === 0) return alert('Hãy chọn ít nhất 1 ghế!');
    
    const totalPrice = selectedSeats.length * selectedMovie.price;
    try {
      await axios.post(`${GATEWAY}/bookings`, {
        userId: user.id,
        movieId: selectedMovie.id,
        seats: selectedSeats,
        totalPrice
      });
      alert('✅ Booking PENDING! Event BOOKING_CREATED → Payment Service đang xử lý...');
      fetchBookings();
      setView('status');
    } catch (err) {
      alert('Booking lỗi');
    }
  };

  if (view === 'login') {
    return (
      <div className="login-container">
        <div className="card">
          <div className="login-title">
            <span className="login-emoji">🍿</span>
            <div>
              <h1>Event-Driven</h1>
              <h2 className="login-subtitle">Movie Ticket System</h2>
            </div>
          </div>
          <form onSubmit={handleLogin}>
            <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <div className="flex-gap">
              <button type="submit">Đăng nhập</button>
              <button type="button" className="btn-secondary" onClick={handleRegister}>Đăng ký</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h2><Film/> MovieTicket</h2>
        <div className="header-right">
          <span><User/> {user.username}</span>
          <button onClick={() => setView('movies')} className={view==='movies'?'active':''}>Phim Đang Chiếu</button>
          <button onClick={() => setView('status')} className={view==='status'?'active':''}>
            <Ticket/> Vé của tôi
          </button>
          <button className="btn-danger" onClick={logout}>Thoát</button>
        </div>
      </header>

      {view === 'movies' && (
        <div className="movie-grid">
          {movies.map(m => (
            <div key={m.id} className="movie-card">
              <div className="poster">{m.poster}</div>
              <h3>{m.title}</h3>
              <p>{m.price.toLocaleString()} VNĐ</p>
              <button onClick={() => startBooking(m)}>Mua vé ngay</button>
            </div>
          ))}
        </div>
      )}

      {view === 'booking' && selectedMovie && (
        <div className="booking-view card">
          <h2>Chọn ghế cho phim: {selectedMovie.title}</h2>
          <div className="screen">MÀN HÌNH</div>
          <div className="seats-grid">
            {['A1','A2','A3','B1','B2','B3','C1','C2','C3'].map(seat => (
              <div 
                key={seat} 
                className={`seat ${selectedSeats.includes(seat) ? 'selected' : ''}`}
                onClick={() => toggleSeat(seat)}
              >
                {seat}
              </div>
            ))}
          </div>
          <div className="booking-summary">
            <div className="summary-row"><span>Ghế đã chọn:</span><strong>{selectedSeats.join(', ') || 'Chưa chọn'}</strong></div>
            <div className="summary-row total"><span>Tổng tiền:</span><strong>{(selectedSeats.length * selectedMovie.price).toLocaleString()} VNĐ</strong></div>
            <div className="summary-actions">
              <button onClick={submitBooking}>🎟️ Thanh toán (Tạo Event)</button>
              <button className="btn-secondary" onClick={() => setView('movies')}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {view === 'status' && (
        <div className="status-view">
          <h2>Lịch sử đặt vé của bạn</h2>
          <p className="hint">Trạng thái sẽ tự động cập nhật qua event từ Payment Service (polling 3s)</p>
          
          {bookings.length === 0 ? <p>Bạn chưa đặt vé nào.</p> : (
            <div className="booking-list">
              {bookings.slice().reverse().map(b => {
                const movie = movies.find(m => m.id === b.movieId);
                return (
                  <div key={b.id} className="booking-item">
                    <div className="b-info">
                      <div className="b-title">
                        <span className="b-id">#{b.id}</span>
                        <span className="b-movie">{movie ? `${movie.poster} ${movie.title}` : 'Unknown'}</span>
                      </div>
                      <div className="b-detail">🪑 Ghế: <strong>{b.seats.join(', ')}</strong></div>
                      <div className="b-detail">💰 Tổng: <strong>{b.totalPrice.toLocaleString()} VNĐ</strong></div>
                    </div>
                    <div className={`b-status status-${b.status.toLowerCase()}`}>
                      {b.status === 'PENDING' && '⏳ Đang xử lý...'}
                      {b.status === 'PAID' && <><CheckCircle size={16}/> Đã thanh toán</>}
                      {b.status === 'FAILED' && <><XCircle size={16}/> Thất bại</>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
