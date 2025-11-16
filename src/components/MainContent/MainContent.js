import React, { useState, useEffect } from 'react';
import './MainContent.css'; // Nhập (Import) file CSS
import { IoChevronForward, IoPlay } from 'react-icons/io5';


// --- Component (Component) ---

function MainContent({ onPlaySong }) {
  const [suggestions, setSuggestions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [albumData, setAlbumData] = useState([]);
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    // Fetch suggestions
    fetch('/api/suggestions')
      .then(response => response.json())
      .then(data => setSuggestions(data))
      .catch(error => console.error('Error fetching suggestions:', error));

    // Fetch charts
    fetch('/api/charts')
      .then(response => response.json())
      .then(data => setChartData(data))
      .catch(error => console.error('Error fetching charts:', error));

    // Fetch albums
    fetch('/api/albums')
      .then(response => response.json())
      .then(data => setAlbumData(data))
      .catch(error => console.error('Error fetching albums:', error));

    // Fetch partners
    fetch('/api/partners')
      .then(response => response.json())
      .then(data => setPartners(data))
      .catch(error => console.error('Error fetching partners:', error));
  }, []);

  return (
    <div className="main-content">

      {/* === PHẦN 1: GỢI Ý BÀI HÁT / ALBUM (SECTION 1: SONG/ALBUM SUGGESTIONS) === */}
      <section className="content-section">
        {/* Tiêu-đề-phần (Section Header) */}
        <div className="section-header">
          <h2>Gợi Ý Cho Bạn</h2>
          <a href="#" className="see-all">
            TẤT CẢ <IoChevronForward />
          </a>
        </div>

        {/* Lưới-carousel (Carousel Grid) (Giống-như (Like) ảnh-của-bạn (your image)) */}
        <div className="carousel-grid three-columns">
          {suggestions.map((item) => (
            <div className="song-card" key={item.id}>
              <div className="card-image">
                <img 
                  src={item.imageUrl || 'https://placehold.co/300x300/7a3c9e/ffffff?text=No+Image'} 
                  alt={item.title}
                  onError={(e) => {
                    console.error('Error loading image:', item.imageUrl);
                    e.target.src = 'https://placehold.co/300x300/7a3c9e/ffffff?text=No+Image';
                  }}
                />
                <div className="overlay-actions">
                  <button className="player-btn icon-btn play-pause-btn" onClick={() => onPlaySong(item)}>
                    <IoPlay />
                  </button>
                </div>
              </div>
              <div className="card-info">
                <h3>{item.title}</h3>
                <p>{item.artists}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === PHẦN 2: BẢNG XẾP HẠNG (#ZINGCHART) (SECTION 2: CHART) === */}
      <section className="content-section">
        <div className="section-header">
          <h2>#zingchart</h2>
          <a href="#" className="see-all">
            TẤT CẢ <IoChevronForward />
          </a>
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
                  onError={(e) => {
                    console.error('Error loading chart image:', song.cover);
                    e.target.src = 'https://placehold.co/60x60/a64883/fff?text=No+Image';
                  }}
                />
                <div className="chart-song-info">
                  <h4>{song.title}</h4>
                  <p>{song.artists}</p>
                </div>
              </div>
              <div className="chart-item-right">
                <button className="player-btn icon-btn play-pause-btn" onClick={() => onPlaySong(song)}>
                  <IoPlay />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === PHẦN 3: ALBUM MỚI (SECTION 3: NEW ALBUMS) === */}
      <section className="content-section">
        {/* Tiêu-đề-phần (Section Header) */}
        <div className="section-header">
          <h2>Album Mới</h2>
          <a href="#" className="see-all">
            TẤT CẢ <IoChevronForward />
          </a>
        </div>

        {/* Sử-dụng-lại (Re-using) 'carousel-grid' và 'song-card'
          Sử-dụng (Using) 'five-columns' để-hiển-thị (to show) 5-album (5 albums)
        */}
        <div className="carousel-grid five-columns">
          {albumData.map((item) => (
            <div className="song-card" key={item.id}>
              <div className="card-image">
                <img 
                  src={item.imageUrl || 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'} 
                  alt={item.title}
                  onError={(e) => {
                    console.error('Error loading album image:', item.imageUrl);
                    e.target.src = 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image';
                  }}
                />
                <div className="overlay-actions">
                  <button className="player-btn icon-btn play-pause-btn" onClick={() => onPlaySong(item)}>
                    <IoPlay />
                  </button>
                </div>
              </div>
              <div className="card-info">
                <h3>{item.title}</h3>
                <p>{item.artists || 'Nhiều nghệ sĩ'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* === KẾT-THÚC-PHẦN-ALBUM (END ALBUM SECTION) === */}


      {/* === PHẦN 4: ĐỐI TÁC ÂM NHẠC (SECTION 4: MUSIC PARTNERS) === */}
      <section className="content-section partners-section">
        <div className="section-header">
          <h2>Đối Tác Âm Nhạc</h2>
        </div>

        <div className="carousel-grid five-columns">
          {partners.map((partner) => (
            <div className="partner-logo" key={partner.id}>
              <img 
                src={partner.logoUrl} 
                alt={partner.name}
                onError={(e) => {
                  console.error('Error loading partner logo:', partner.logoUrl);
                  e.target.src = 'https://placehold.co/150x80/2f2739/a0a0a0?text=Logo';
                }}
              />
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default MainContent;