import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import { IoPersonCircleOutline, IoCameraOutline, IoMusicalNotes, IoHeart, IoDiamond, IoTimeOutline } from 'react-icons/io5';

function UserProfile({ user }) {
  const [stats, setStats] = useState({
    playlists: 0,
    favorites: 0,
    // Thông tin gói cước
    isVip: false,
    planName: 'Đang tải...',
    expiryDate: null,
    daysLeft: 0
  });

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
           const token = localStorage.getItem('token');
           if (!token) return;

           // 1. Lấy thông tin Gói cước
           const subRes = await fetch('http://localhost:5001/api/user/subscription', {
             headers: { 'Authorization': `Bearer ${token}` }
           });
           const subData = await subRes.json();

           // 2. Get Playlists count
           const playlistRes = await fetch('http://localhost:5001/api/playlists', {
            headers: { 'Authorization': `Bearer ${token}` }
           });
           const playlistData = await playlistRes.json();

           // 3. Get Favorites count
           const favRes = await fetch('http://localhost:5001/api/favorites', {
            headers: { 'Authorization': `Bearer ${token}` }
           });
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
            <button className="change-avatar-btn" title="Đổi ảnh đại diện">
              <IoCameraOutline />
            </button>
          </div>
          
          {/* Tên người dùng */}
          <h3 className="profile-name">
            {user.displayName || user.username}
          </h3>

          {/* === SỬA: Đưa VIP tag xuống đây và style lại === */}
          {stats.isVip && (
            <div className="vip-badge-profile">
                <IoDiamond className="diamond-icon"/> <span>VIP</span>
            </div>
          )}
        </div>

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