import React, { useState, useRef, useEffect } from 'react';
import './SettingsMenu.css';
import { 
  IoSettingsOutline, 
  IoEarthOutline, 
  IoChevronForward, 
  IoInformationCircleOutline, 
  IoChatboxEllipsesOutline,
  IoCheckmark
} from 'react-icons/io5';

function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLangSub, setShowLangSub] = useState(false); // State cho menu con Ngôn ngữ
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

  return (
    <div className="settings-menu-container" ref={menuRef}>
      {/* Nút Setting */}
      <button 
        className={`zm-btn zm-tooltip-btn is-hover-circle button ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <IoSettingsOutline />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="settings-dropdown">
          <ul className="settings-list">
            
            {/* Mục Ngôn ngữ - Có Submenu */}
            <li 
                className="settings-item"
                onMouseEnter={() => setShowLangSub(true)}
                onMouseLeave={() => setShowLangSub(false)}
            >
              <div className="item-content">
                <IoEarthOutline className="item-icon" />
                <span>Language</span>
                <IoChevronForward className="arrow-icon" />
              </div>

              {/* Submenu Ngôn ngữ (Hiện ra bên trái) */}
              {showLangSub && (
                <div className="submenu-dropdown">
                  <div className="submenu-item">
                    <span>English</span>
                  </div>
                  <div className="submenu-item active">
                    <span>Tiếng Việt</span>
                    <IoCheckmark className="check-icon" />
                  </div>
                </div>
              )}
            </li>

            <div className="settings-divider"></div>

            {/* Các mục khác */}
            <li className="settings-item">
              <div className="item-content">
                <IoInformationCircleOutline className="item-icon" />
                <span>Hướng dẫn và hỗ trợ</span>
              </div>
            </li>

            <li className="settings-item">
              <div className="item-content">
                <IoChatboxEllipsesOutline className="item-icon" />
                <span>Góp ý</span>
              </div>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;