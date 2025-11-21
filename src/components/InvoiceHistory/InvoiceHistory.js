import React, { useState, useEffect } from 'react';
import './InvoiceHistory.css';
import { IoReceiptOutline, IoChevronForward } from 'react-icons/io5';

function InvoiceHistory({ onViewInvoiceDetail }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5001/api/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setInvoices(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
    }
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) return <div className="invoice-loading">Đang tải lịch sử giao dịch...</div>;

  return (
    <div className="invoice-history-container">
      <div className="invoice-header">
        <h2>Lịch Sử Giao Dịch</h2>
      </div>

      <div className="invoice-list">
        {invoices.length === 0 ? (
          <div className="no-invoices">Bạn chưa có giao dịch nào.</div>
        ) : (
          invoices.map(inv => (
            <div 
                className="invoice-item" 
                key={inv.id}
                onClick={() => onViewInvoiceDetail(inv.id)}
            >
              <div className="invoice-icon">
                <IoReceiptOutline />
              </div>
              <div className="invoice-info">
                <div className="invoice-title">Thanh toán dịch vụ</div>
                <div className="invoice-date">{formatDate(inv.date)}</div>
              </div>
              <div className="invoice-right">
                 <div className="invoice-amount">{formatCurrency(inv.totalAmount)}</div>
                 <div className={`invoice-status ${inv.status}`}>
                    {inv.status === 'paid' || inv.status === 'completed' ? 'Thành công' : 'Đang xử lý'}
                 </div>
              </div>
              <div className="invoice-arrow">
                 <IoChevronForward />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default InvoiceHistory;