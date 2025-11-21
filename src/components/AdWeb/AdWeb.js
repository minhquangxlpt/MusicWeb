import { useEffect, useState, useRef } from 'react';

function AdWeb({ isLoggedIn }) {
  const [shouldShowAd, setShouldShowAd] = useState(false);
  const [adLink, setAdLink] = useState('');
  // Dùng ref để theo dõi trạng thái click mà không gây re-render
  const hasClickedRef = useRef(false); 
  
  // Effect 1: Kiểm tra quyền và lấy link quảng cáo
  useEffect(() => {
    const checkAdsStatus = async () => {
      let isVip = false;

      // Reset trạng thái click khi đăng nhập/đăng xuất thay đổi
      hasClickedRef.current = false; 

      if (isLoggedIn) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5001/api/user/check-ads', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          isVip = data.isVip;
          console.log("AdWeb: User VIP status:", isVip);
        } catch (error) {
          console.error("AdWeb: Lỗi check VIP:", error);
          // Nếu lỗi mạng, tạm thời coi như không VIP để hiện quảng cáo
        }
      } else {
          console.log("AdWeb: User not logged in (Non-VIP)");
      }

      // Nếu KHÔNG phải VIP -> Lấy link quảng cáo
      if (!isVip) {
        try {
          const adResponse = await fetch('http://localhost:5001/api/ads/random');
          const adData = await adResponse.json();
          if (adData.link) {
            console.log("AdWeb: Loaded ad link:", adData.link);
            setAdLink(adData.link);
            setShouldShowAd(true);
          } else {
             console.log("AdWeb: No ad link returned");
          }
        } catch (error) {
          console.error("AdWeb: Lỗi lấy link quảng cáo:", error);
        }
      } else {
        // Nếu là VIP -> Tắt quảng cáo
        setShouldShowAd(false);
        setAdLink('');
      }
    };

    checkAdsStatus();
  }, [isLoggedIn]); // Chạy lại khi trạng thái đăng nhập thay đổi

  // Effect 2: Lắng nghe click toàn trang
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Chỉ xử lý nếu cần hiện quảng cáo, có link, và chưa click lần nào
      if (shouldShowAd && adLink && !hasClickedRef.current) {
        
        // Quan trọng: Kiểm tra xem click có phải vào nút/link nội bộ không?
        // Nếu muốn quảng cáo hiện ra BẤT KỂ click vào đâu (kể cả nút Play), giữ nguyên.
        // Nếu muốn tránh click nhầm vào nút chức năng, cần check e.target.

        console.log("AdWeb: Opening ad...", adLink);
        
        // Đánh dấu đã click NGAY LẬP TỨC để tránh mở nhiều tab
        hasClickedRef.current = true;
        
        // Mở tab mới
        const newWindow = window.open(adLink, '_blank');
        
        // Kiểm tra nếu bị chặn pop-up
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') { 
            console.warn("AdWeb: Pop-up blocked by browser");
            // Có thể hiển thị thông báo yêu cầu user tắt chặn pop-up nếu muốn
        } else {
            // Focus lại cửa sổ hiện tại để không làm gián đoạn trải nghiệm (tùy chọn)
            // window.focus(); 
        }
      }
    };

    if (shouldShowAd) {
        console.log("AdWeb: Adding global click listener");
        // Sử dụng 'capture: true' để bắt sự kiện sớm nhất có thể
        window.addEventListener('click', handleGlobalClick, true);
    } else {
        window.removeEventListener('click', handleGlobalClick, true);
    }

    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
    };
  }, [shouldShowAd, adLink]);

  return null;
}

export default AdWeb;