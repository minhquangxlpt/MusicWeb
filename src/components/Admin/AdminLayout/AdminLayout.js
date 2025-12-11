import React, { useState } from 'react';
import './AdminLayout.css';
import { 
  IoHomeOutline, 
  IoMusicalNotesOutline, 
  IoAlbumsOutline, 
  IoPeopleOutline, 
  IoLogOutOutline,
  IoPersonCircleOutline
} from 'react-icons/io5';

function AdminLayout({ children, onNavigate, currentView, onLogout }) {
  return (
    <div className="admin-container">
      {/* Sidebar Admin */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>Music Admin</h2>
        </div>
        
        <nav className="admin-nav">
          <ul>
            <li 
              className={currentView === 'dashboard' ? 'active' : ''}
              onClick={() => onNavigate('dashboard')}
            >
              <IoHomeOutline /> Tổng Quan
            </li>
            <li 
              className={currentView === 'songs' ? 'active' : ''}
              onClick={() => onNavigate('songs')}
            >
              <IoMusicalNotesOutline /> Quản Lý Bài Hát
            </li>
            
            <li 
              className={currentView === 'users' ? 'active' : ''}
              onClick={() => onNavigate('users')}
            >
              <IoPeopleOutline /> Quản Lý Người Dùng
            </li>
          </ul>
        </nav>

        <div className="admin-footer">
           <button className="admin-logout-btn" onClick={onLogout}>
              <IoLogOutOutline /> Đăng Xuất
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
            <h3>Quản Trị Hệ Thống</h3>
            <div className="admin-profile">
                <span>Admin</span>
                <IoPersonCircleOutline size={30} />
            </div>
        </header>
        
        <div className="admin-content-wrapper">
            {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;