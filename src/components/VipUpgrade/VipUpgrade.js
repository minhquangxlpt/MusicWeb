import React, { useState, useEffect } from 'react';
import './VipUpgrade.css';
import { IoCheckmarkCircle, IoDiamond } from 'react-icons/io5';

function VipUpgrade({ onBuy }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch danh sách gói VIP từ server
    fetch('http://localhost:5001/api/vip-packages')
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) {
              setPackages(data);
          }
      })
      .catch(err => console.error("Lỗi tải gói cước:", err))
      .finally(() => setLoading(false));
  }, []);
  
  const handleBuyClick = (pkg) => {
      // Kiểm tra an toàn: chỉ gọi nếu onBuy là một hàm
      if (typeof onBuy === 'function') {
          // Truyền cả ID gói để server xử lý chính xác
          onBuy({ 
              id: pkg.id, 
              name: pkg.name, 
              price: pkg.formattedPrice,
              rawPrice: pkg.price // Giá dạng số để tính toán nếu cần
          });
      } else {
          console.error("Lỗi: Prop 'onBuy' chưa được truyền vào VipUpgrade!");
          alert("Chức năng mua đang lỗi. Vui lòng thử lại sau.");
      }
  };

  if (loading) {
      return <div className="vip-upgrade-container" style={{display:'flex',justifyContent:'center',alignItems:'center'}}>Loading...</div>;
  }

  return (
    <div className="vip-upgrade-container">
      
      <div className="vip-header-banner">
        <div className="vip-header-content">
          <h1>Nâng Cấp VIP</h1>
          <p>Nghe nhạc không giới hạn, chất lượng cao</p>
          <div className="vip-badge">
             <IoDiamond /> MEMBER VIP
          </div>
        </div>
      </div>

      <div className="vip-packages-section">
        <h2>Chọn Gói Cước Phù Hợp</h2>
        <div className="vip-packages-grid">
            
            {packages.map((pkg) => (
                <div key={pkg.id} className={`vip-package-card ${pkg.isRecommended ? 'recommended' : ''}`}>
                    {pkg.isRecommended && <div className="best-value-tag">PHỔ BIẾN NHẤT</div>}
                    
                    <div className="package-header">
                        {/* Tên gói (ví dụ: Gói 1 Tháng) */}
                        <h3>{pkg.name.toUpperCase()}</h3> 
                        <span className="package-price">{pkg.formattedPrice}</span>
                        {pkg.duration >= 180 && <span className="package-save">Tiết kiệm hơn</span>}
                    </div>

                    <div className="package-body">
                        <ul>
                            {pkg.features && pkg.features.map((feature, index) => (
                                <li key={index}><IoCheckmarkCircle /> {feature}</li>
                            ))}
                        </ul>
                    </div>
                    
                    <button 
                        className={`btn-buy-vip ${pkg.isRecommended ? 'primary' : ''}`}
                        onClick={() => handleBuyClick(pkg)}
                    >
                        MUA NGAY
                    </button>
                </div>
            ))}

        </div>
      </div>

      <div className="vip-benefits-section">
          <h2>Đặc Quyền VIP</h2>
          <div className="benefits-grid">
              <div className="benefit-item">
                  <img src="https://stc-id.nixcdn.com/v11/images/icon-vip-1.png" alt="Lossless" />
                  <h4>Chất lượng Lossless</h4>
                  <p>Thưởng thức âm nhạc chuẩn phòng thu</p>
              </div>
              <div className="benefit-item">
                  <img src="https://stc-id.nixcdn.com/v11/images/icon-vip-2.png" alt="No Ads" />
                  <h4>Không Quảng Cáo</h4>
                  <p>Trải nghiệm nghe nhạc không bị gián đoạn</p>
              </div>
              <div className="benefit-item">
                  <img src="https://stc-id.nixcdn.com/v11/images/icon-vip-3.png" alt="Download" />
                  <h4>Tải Nhạc Không Giới Hạn</h4>
                  <p>Lưu trữ bài hát yêu thích để nghe offline</p>
              </div>
          </div>
      </div>

    </div>
  );
}

export default VipUpgrade;