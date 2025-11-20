import React, { useState, useEffect } from 'react';
import './MainContent.css'; 
import { IoChevronForward, IoPlay, IoRefresh, IoEllipsisHorizontal } from 'react-icons/io5'; // Thêm import icon

function MainContent({ onPlaySong, onViewAlbum, onOpenSongAction, isLoggedIn, favorites, onToggleFavorite }) {
  const [suggestions, setSuggestions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [albumData, setAlbumData] = useState([]);
  const [partners, setPartners] = useState([]);

  // --- FETCH DATA ---
  const fetchSuggestions = () => {
    fetch('http://localhost:5001/api/suggestions') 
      .then(response => response.json())
      .then(data => setSuggestions(data))
      .catch(error => console.error('Error fetching suggestions:', error));
  };

  const fetchChartData = () => {
    fetch('http://localhost:5001/api/charts')
      .then(response => response.json())
      .then(data => setChartData(data))
      .catch(error => console.error('Error fetching charts:', error));
  };

  const fetchAlbumData = () => {
    fetch('http://localhost:5001/api/albums')
      .then(response => response.json())
      .then(data => setAlbumData(data))
      .catch(error => console.error('Error fetching albums:', error));
  };

  const fetchPartners = () => {
     fetch('http://localhost:5001/api/partners')
      .then(response => response.json())
      .then(data => setPartners(data))
      .catch(error => console.error('Error fetching partners:', error));
  };

  useEffect(() => {
    fetchSuggestions();
    fetchChartData();
    fetchAlbumData();
    fetchPartners();
  }, []);

  return (
    <div className="main-content">
      {/* === GỢI Ý BÀI HÁT === */}
      <section className="content-section">
        <div className="section-header">
          <h2>Gợi Ý Bài Hát</h2>
          <button className="zm-btn refresh-btn" onClick={fetchSuggestions}>
            <IoRefresh />
            LÀM MỚI
          </button>
        </div>
        
        <div className="song-list-grid three-columns">
          {suggestions.map((item) => (
            <div
              className="song-item"
              key={item.id}
              // Click vào cả khối cũng phát nhạc (UX tốt hơn) - nhưng phải cẩn thận với click vào nút action
              // Tốt nhất là bỏ click tổng, chỉ click vào ảnh/tên để tránh xung đột với nút action
              // Hoặc giữ lại và dùng e.stopPropagation() ở nút action (đã làm bên dưới)
               onClick={() => onPlaySong(item, suggestions)}
            >
              <div className="song-item-left">
                <img 
                    src={item.imageUrl || 'https://placehold.co/60x60/7a3c9e/ffffff?text=Err'} 
                    alt={item.title} 
                    className="song-item-cover" 
                    onError={(e) => { e.target.src = 'https://placehold.co/60x60/7a3c9e/ffffff?text=Err'; }}
                />
                <div className="song-item-play-icon">
                  <IoPlay />
                </div>
              </div>
              
              <div className="song-item-info">
                 <h4 className="song-title-clickable">
                    {item.title}
                 </h4>
                 <p>{item.artists}</p>
              </div>

              {/* === SỬA: Thêm khu vực Action (Yêu thích & Tùy chọn) === */}
              <div className="song-item-actions">
                <button 
                    className="action-btn"
                    onClick={(e) => {
                        e.stopPropagation(); // Ngăn phát nhạc khi bấm nút này
                        if (onOpenSongAction) onOpenSongAction(item);
                    }}
                    title="Khác"
                >
                    <IoEllipsisHorizontal />
                </button>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* === BẢNG XẾP HẠNG === */}
      {/* (Giữ nguyên phần này hoặc áp dụng tương tự nếu muốn) */}
      <section className="content-section">
        <div className="section-header">
          <h2>Bảng Xếp Hạng Nhạc</h2>
          <a href="#" className="see-all">TẤT CẢ <IoChevronForward /></a>
        </div>
        <div className="chart-container">
          {Array.isArray(chartData) && chartData.map((song, index) => (
            <div className="chart-item" key={song.id}>
              <div className="chart-item-left">
                <span className={`chart-rank rank-${song.rank || (index + 1)}`}>{song.rank || (index + 1)}</span>
                <img
                  src={song.cover || 'https://placehold.co/60x60/a64883/fff?text=No+Image'}
                  alt={song.title}
                  className="chart-cover"
                  onError={(e) => { e.target.src = 'https://placehold.co/60x60/a64883/fff?text=No+Image'; }}
                  onClick={() => onPlaySong(song, chartData)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="chart-song-info">
                  <h4 
                    className="song-title-clickable"
                    onClick={() => onPlaySong(song, chartData)}
                  >
                    {song.title}
                  </h4>
                  <p>{song.artists}</p>
                </div>
              </div>
              <div className="chart-item-right">
                <button className="player-btn icon-btn play-pause-btn chart-play-btn" onClick={() => onPlaySong(song, chartData)}>
                  <IoPlay />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === ALBUM MỚI === */}
      <section className="content-section">
        <div className="section-header">
          <h2>Album Mới</h2>
          <a href="#" className="see-all">TẤT CẢ <IoChevronForward /></a>
        </div>
        <div className="carousel-grid five-columns">
          {albumData.map((item) => (
            <div className="song-card" key={item.id} onClick={() => onViewAlbum(item.id)} style={{cursor: 'pointer'}}>
              <div className="card-image">
                <img
                  src={item.imageUrl || 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'}
                  alt={item.title}
                  onError={(e) => { e.target.src = 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'; }}
                />
              </div>
              <div className="card-info">
                <h3>{item.title}</h3>
                <p>{item.artists || 'Nhiều nghệ sĩ'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === ĐỐI TÁC === */}
      <section className="content-section partners-section">
        <div className="section-header"><h2>Đối Tác Âm Nhạc</h2></div>
        <div className="carousel-grid five-columns">
          {partners.map((partner) => (
            <div className="partner-logo" key={partner.id}>
              <img
                src={partner.logoUrl}
                alt={partner.name}
                onError={(e) => { e.target.src = 'https://placehold.co/150x80/2f2739/a0a0a0?text=Logo'; }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MainContent;