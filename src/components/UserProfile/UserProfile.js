import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import { IoPersonCircleOutline, IoCameraOutline } from 'react-icons/io5';

function UserProfile({ user }) {
  // Bạn có thể thêm logic chỉnh sửa thông tin ở đây sau này
  
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
            <button className="change-avatar-btn">
              <IoCameraOutline />
            </button>
          </div>
          <h3 className="profile-name">{user.displayName || user.username}</h3>
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
          
          {/* Bạn có thể thêm nút chỉnh sửa ở đây */}
          <button className="zm-btn edit-profile-btn" onClick={() => alert("Chức năng đang phát triển")}>
            Chỉnh sửa thông tin
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;