import React, { useState, useEffect } from 'react';
import './InvoiceDetail.css';
import { IoArrowBack, IoCheckmarkCircle, IoTimeOutline } from 'react-icons/io5';

function InvoiceDetail({ invoiceId, onBack }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && invoiceId) {
      fetch(`http://localhost:5001/api/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
          if (!data.error) setInvoice(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
    }
  }, [invoiceId]);

  if (loading) return <div className="invoice-loading">Đang tải chi tiết...</div>;
  if (!invoice) return <div className="invoice-loading">Không tìm thấy hóa đơn.</div>;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="invoice-detail-page">
        <button className="back-btn" onClick={onBack}>
            <IoArrowBack /> Quay lại danh sách
        </button>

        <div className="invoice-card">
            <div className="invoice-card-header">
                <h3>Chi Tiết Hóa Đơn #{invoice.id}</h3>
                <div className={`status-badge ${invoice.status}`}>
                    {invoice.status === 'paid' || invoice.status === 'completed' ? (
                        <><IoCheckmarkCircle /> Thành công</>
                    ) : (
                        <><IoTimeOutline /> Đang xử lý</>
                    )}
                </div>
            </div>

            <div className="invoice-section">
                <p className="invoice-label">Thời gian giao dịch</p>
                <p className="invoice-value">{formatDate(invoice.date)}</p>
            </div>

            <div className="invoice-divider"></div>

            <div className="invoice-section">
                <p className="invoice-label">Chi tiết dịch vụ</p>
                <div className="invoice-items">
                    {invoice.items && invoice.items.map((item, idx) => (
                        <div key={idx} className="item-row">
                            <div className="item-desc">
                                <span className="item-name">{item.packageName || 'Dịch vụ VIP'}</span>
                                <span className="item-sub">{item.description}</span>
                            </div>
                            <div className="item-price">{formatCurrency(item.amount)}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="invoice-divider"></div>

            <div className="invoice-total-row">
                <span>Tổng thanh toán</span>
                <span className="total-amount">{formatCurrency(invoice.totalAmount)}</span>
            </div>
        </div>
    </div>
  );
}

export default InvoiceDetail;