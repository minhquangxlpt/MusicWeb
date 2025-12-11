import React, { useState, useEffect, useRef } from 'react'; // Thêm useRef
import './UserProfile.css';
import { IoPersonCircleOutline, IoCameraOutline, IoMusicalNotes, IoHeart, IoDiamond, IoTimeOutline } from 'react-icons/io5';

function UserProfile({ user }) {
  const [stats, setStats] = useState({
    playlists: 0,
    favorites: 0,
    isVip: false,
    planName: 'Đang tải...',
    expiryDate: null,
    daysLeft: 0
  });

  // Ref cho input file
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      // ... (giữ nguyên logic fetch stats cũ)
      const fetchUserData = async () => {
        try {
           const token = localStorage.getItem('token');
           if (!token) return;

           const subRes = await fetch('http://localhost:5001/api/user/subscription', { headers: { 'Authorization': `Bearer ${token}` } });
           const subData = await subRes.json();
           const playlistRes = await fetch('http://localhost:5001/api/playlists', { headers: { 'Authorization': `Bearer ${token}` } });
           const playlistData = await playlistRes.json();
           const favRes = await fetch('http://localhost:5001/api/favorites', { headers: { 'Authorization': `Bearer ${token}` } });
           const favData = await favRes.json();

           setStats({
             isVip: subData.isVip,
             planName: subData.planName,
             expiryDate: subData.expiryDate,
             daysLeft: subData.daysLeft,
             playlists: Array.isArray(playlistData) ? playlistData.length : 0,
             favorites: Array.isArray(favData) ? favData.length : 0
           });

        } catch (error) {
          console.error("Error loading user profile data:", error);
        }
      };
      fetchUserData();
    }
  }, [user]);

  // Hàm xử lý khi click vào nút Camera -> Kích hoạt input file
  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  // Hàm xử lý khi người dùng chọn file
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate loại file (chỉ ảnh)
    if (!file.type.startsWith('image/')) {
        alert("Vui lòng chọn file ảnh!");
        return;
    }

    // Tạo FormData để gửi file
    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/user/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Lưu ý: Không set Content-Type khi dùng FormData, browser tự làm việc đó
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            alert("Cập nhật ảnh đại diện thành công!");
            // Cập nhật lại user trong localStorage và state của App (cần reload hoặc callback)
            // Cách đơn giản nhất để cập nhật toàn bộ App là reload lại trang
            // Hoặc tốt hơn là gọi một hàm update user từ props (nếu có)
            
            // Cập nhật tạm thời localStorage để giữ data mới
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser) {
                currentUser.avatar = data.avatarUrl;
                localStorage.setItem('user', JSON.stringify(currentUser));
            }
            
            window.location.reload(); // Reload để cập nhật avatar ở Header và Sidebar
        } else {
            alert(data.error || "Lỗi khi upload ảnh");
        }
    } catch (error) {
        console.error("Upload error:", error);
        alert("Lỗi kết nối server");
    }
  };

  // ... (giữ nguyên formatDate)
  const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (!user) return <div className="user-profile-loading">Đang tải thông tin...</div>;

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <h2>Thông Tin Tài Khoản</h2>
      </div>

      <div className="profile-content">
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <img 
              src={user.avatar || "https://zmdjs.zmdcdn.me/zmp3-desktop/v1.17.3/static/media/user-default.3ff115bb.png"} 
              alt={user.displayName} 
              className="profile-avatar"
            />
            
            {/* Input file ẩn */}
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Nút Camera kích hoạt input file */}
            <button className="change-avatar-btn" title="Đổi ảnh đại diện" onClick={handleCameraClick}>
              <IoCameraOutline />
            </button>
          </div>
          <h3 className="profile-name">
            {user.displayName || user.username}
          </h3>
          
          {stats.isVip && (
            <div className="vip-badge-profile">
                <IoDiamond className="diamond-icon"/> <span>VIP</span>
            </div>
          )}
        </div>

        {/* ... (Các phần còn lại giữ nguyên) ... */}
         <div className="profile-stats-bar">
            <div className="stat-box">
                <span className="stat-value">{stats.playlists}</span>
                <span className="stat-label"><IoMusicalNotes /> Playlist</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-box">
                <span className="stat-value">{stats.favorites}</span>
                <span className="stat-label"><IoHeart /> Yêu thích</span>
            </div>
        </div>

        <div className="profile-details-section">
          <div className="profile-group">
            <label>Tên hiển thị</label>
            <div className="profile-value">{user.displayName || "Chưa cập nhật"}</div>
          </div>
          
          <div className="profile-group">
            <label>Tên đăng nhập</label>
            <div className="profile-value">{user.username}</div>
          </div>

          <div className="profile-group">
            <label>Email</label>
            <div className="profile-value">{user.email || "Chưa cập nhật"}</div>
          </div>

           <div className="profile-group">
            <label>Gói dịch vụ</label>
            <div className="profile-value subscription-info">
                {stats.isVip ? (
                    <>
                        <div className="sub-name vip">
                            <IoDiamond /> {stats.planName} 
                            <span className="sub-days-inline"> - Còn lại: {stats.daysLeft} ngày</span>
                        </div>
                    </>
                ) : (
                    <div className="sub-name free">
                        {stats.planName}
                    </div>
                )}
            </div>
          </div>
          
          <button className="zm-btn edit-profile-btn" onClick={() => alert("Chức năng đang phát triển")}>
            Chỉnh sửa thông tin
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;