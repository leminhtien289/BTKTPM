const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function OrderModal({ order, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1040 }}
        onClick={onClose}
      />
      {/* Modal */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="modal-dialog modal-dialog-centered w-100 m-0" style={{ maxWidth: 480 }}>
          <div className="modal-content border-0 shadow">
            <div className="modal-header text-white border-0" style={{ background: '#2e7d32', borderRadius: '8px 8px 0 0' }}>
              <h5 className="modal-title">✅ Đặt hàng thành công!</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="alert alert-success py-2 mb-3">
                <small className="text-muted d-block">Mã đơn hàng</small>
                <code style={{ fontSize: '.78rem', wordBreak: 'break-all' }}>{order.id}</code>
              </div>
              <table className="table table-sm mb-2">
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td className="text-end text-muted">×{item.quantity}</td>
                      <td className="text-end fw-bold">{fmt(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                  <tr className="table-danger fw-bold">
                    <td colSpan={2}>Tổng cộng</td>
                    <td className="text-end">{fmt(order.total)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-muted mb-0" style={{ fontSize: '.75rem' }}>
                ⚡ {new Date(order.createdAt).toLocaleString('vi-VN')}<br />
                Toàn bộ xử lý trong Data Grid — không qua database
              </p>
            </div>
            <div className="modal-footer border-0">
              <button className="btn btn-success" onClick={onClose}>Tiếp tục mua sắm</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
