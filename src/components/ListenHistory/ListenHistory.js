import React, { useState, useEffect } from 'react';
import './ListenHistory.css';
import { IoPlay, IoTimeOutline } from 'react-icons/io5';

function ListenHistory({ onPlaySong }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5001/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error('Error loading history:', err));
    }
  }, []);

  // Hàm format thời gian (ví dụ: "2 giờ trước")
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <div className="listen-history">
      <div className="history-header">
        <h2>Nghe Gần Đây</h2>
        <button 
          className="zm-btn play-all-btn"
          onClick={() => history.length > 0 && onPlaySong(history[0], history)}
        >
          <IoPlay /> PHÁT TẤT CẢ
        </button>
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div className="no-history">
            <p>Bạn chưa nghe bài hát nào gần đây.</p>
          </div>
        ) : (
          history.map((song, index) => (
            <div 
              className="history-item" 
              key={`${song.id}-${index}`} // Key unique vì 1 bài có thể nghe nhiều lần
              onClick={() => onPlaySong(song, history)}
            >
              <div className="history-item-left">
                <img 
                  src={song.imageUrl} 
                  alt={song.title} 
                  className="history-item-cover" 
                  onError={(e) => { e.target.src = 'https://placehold.co/60x60/7a3c9e/ffffff?text=Err'; }}
                />
                <div className="history-item-info">
                  <h4>{song.title}</h4>
                  <p>{song.artists}</p>
                </div>
              </div>
              <div className="history-item-right">
                 <span className="time-ago">
                    <IoTimeOutline /> {formatTimeAgo(song.playedAt)}
                 </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ListenHistory;