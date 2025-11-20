import React from 'react';
import './SongActionModal.css';
import { IoClose, IoAddCircleOutline, IoHeadset, IoHeartOutline, IoHeart } from 'react-icons/io5';

function SongActionModal({ song, onClose, isFavorite, onToggleFavorite, onAddToPlaylist }) {
  if (!song) return null;

  const formatNumber = (num) => {
    // Chuyển về số nguyên để tránh lỗi nếu num là string '100'
    const n = parseInt(num, 10);
    if (!n || isNaN(n)) return 0;
    
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n;
  };

  return (
    <div className="song-action-overlay" onClick={onClose}>
      <div className="song-action-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-action-btn" onClick={onClose}>
            <IoClose />
        </button>

        <div className="song-action-header">
            <img 
                src={song.imageUrl || 'https://placehold.co/60x60'} 
                alt={song.title} 
                className="action-cover"
            />
            <div className="action-info">
                <h3>{song.title}</h3>
                <div className="action-stats">
                    <span className="stat-item" title="Lượt thích">
                        <IoHeartOutline /> {formatNumber(song.likeCount)}
                    </span>
                    <span className="stat-item" title="Lượt nghe">
                        <IoHeadset /> {formatNumber(song.listenCount)}
                    </span>
                </div>
            </div>
        </div>

        <div className="action-divider"></div>

        <div className="action-list">
            {/* Nút Yêu thích */}
            <div 
                className="action-item" 
                onClick={() => {
                    onToggleFavorite(song.id);
                }}
            >
                <span className="action-icon">
                    {isFavorite ? <IoHeart style={{color: '#9b4de0'}} /> : <IoHeartOutline />}
                </span>
                <span className="action-text">
                    {isFavorite ? 'Xóa khỏi thư viện' : 'Thêm vào thư viện'}
                </span>
            </div>

            {/* Nút Thêm vào playlist */}
            <div 
                className="action-item"
                onClick={() => {
                    onAddToPlaylist(song); 
                    onClose(); 
                }}
            >
                <span className="action-icon">
                    <IoAddCircleOutline />
                </span>
                <span className="action-text">Thêm vào danh sách phát</span>
            </div>
        </div>
      </div>
    </div>
  );
}

export default SongActionModal;