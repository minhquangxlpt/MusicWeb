import React, { useState, useRef, useEffect } from 'react';
import './UserMenu.css';
import { 
  IoPersonCircleOutline, 
  IoLogOutOutline, 
  IoKeyOutline, 
  IoPersonOutline,
  IoLogInOutline,
  IoPersonAddOutline,
  IoReceiptOutline
} from 'react-icons/io5';

// === SỬA: Đã thêm 'onChangePassword' vào danh sách props ===
function UserMenu({ user, isLoggedIn, onLogin, onLogout, onChangePassword, onViewProfile, onViewInvoices }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="user-menu-container" ref={menuRef}>
      {/* Nút Avatar / Icon Người dùng */}
      <button className="user-avatar-btn" onClick={toggleMenu}>
        {isLoggedIn && user ? (
           <figure className="image is-38x38 is-rounded">
               <img 
                   src={user.avatar || "https://zmdjs.zmdcdn.me/zmp3-desktop/v1.17.3/static/media/user-default.3ff115bb.png"} 
                   alt={user.displayName || user.username} 
               />
           </figure>
        ) : (
            <div className="default-avatar">
                <IoPersonCircleOutline />
            </div>
        )}
      </button>

      {/* Menu Thả Xuống */}
      {isOpen && (
        <div className="user-dropdown">
          {isLoggedIn ? (
            // === MENU KHI ĐÃ ĐĂNG NHẬP ===
            <>
              <div className="user-info-header">
                <img 
                    src={user.avatar || "https://zmdjs.zmdcdn.me/zmp3-desktop/v1.17.3/static/media/user-default.3ff115bb.png"} 
                    alt="Avatar" 
                    className="menu-avatar"
                />
                <div className="user-details">
                    <span className="user-name">{user.displayName || user.username}</span>
                    <span className="user-email">{user.email}</span>
                </div>
              </div>
              <div className="menu-divider"></div>
              
              <button className="menu-item" onClick={() => { setIsOpen(false); onViewProfile(); }}>
                <IoPersonOutline /> Thông tin tài khoản
              </button>
              
              <button className="menu-item" onClick={() => { setIsOpen(false); onViewInvoices(); }}>
                <IoReceiptOutline /> Lịch sử giao dịch
              </button>

              {/* Nút Đổi mật khẩu sẽ hoạt động vì prop đã được nhận */}
              <button className="menu-item" onClick={() => { setIsOpen(false); onChangePassword(); }}>
                <IoKeyOutline /> Đổi mật khẩu
              </button>
              
              <div className="menu-divider"></div>
              <button className="menu-item logout" onClick={() => { setIsOpen(false); onLogout(); }}>
                <IoLogOutOutline /> Đăng xuất
              </button>
            </>
          ) : (
            // === MENU KHI CHƯA ĐĂNG NHẬP ===
            <>
              <button className="menu-item" onClick={() => { setIsOpen(false); onLogin(); }}>
                <IoLogInOutline /> Đăng nhập
              </button>
              <button className="menu-item" onClick={() => { setIsOpen(false); onLogin(); }}>
                <IoPersonAddOutline /> Đăng ký
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default UserMenu;