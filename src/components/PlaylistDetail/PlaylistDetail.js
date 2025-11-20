import React, { useState, useEffect } from 'react';
import './PlaylistDetail.css';
import { IoArrowBack, IoPlay, IoHeart } from 'react-icons/io5';

function PlaylistDetail({ playlistId, onBack, onPlaySong }) {
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && playlistId) {
      setLoading(true);
      fetch(`http://localhost:5001/api/playlists/${playlistId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
          if (!res.ok) {
              throw new Error('Failed to fetch playlist');
          }
          return res.json();
      })
      .then(data => {
        if (data.error) {
            console.error(data.error);
        } else {
            // Tách mảng songs ra khỏi object data
            const { songs, ...info } = data;
            setPlaylistInfo(info);
            setSongs(songs || []);
        }
      })
      .catch(err => console.error('Error loading playlist detail:', err))
      .finally(() => setLoading(false));
    }
  }, [playlistId]);

  if (loading) {
    return <div className="playlist-loading">Đang tải...</div>;
  }

  if (!playlistInfo) {
      return <div className="playlist-loading">Không tìm thấy playlist.</div>;
  }

  return (
    <div className="playlist-detail">
      <button className="back-btn" onClick={onBack}>
        <IoArrowBack /> Trở lại
      </button>

      <div className="playlist-detail-header">
        <div className="playlist-detail-cover">
            <img 
              src={playlistInfo.coverImage || 'https://placehold.co/300x300/2f2739/ffffff?text=Playlist'} 
              alt={playlistInfo.name} 
              onError={(e) => { e.target.src = 'https://placehold.co/300x300/2f2739/ffffff?text=Playlist'; }}
            />
        </div>
        <div className="playlist-detail-info">
          <h1>{playlistInfo.name}</h1>
          <p className="playlist-desc">{playlistInfo.description || 'Tạo bởi bạn'}</p>
          <p className="playlist-meta">
              {songs.length} bài hát • Cập nhật: {playlistInfo.createdAt ? new Date(playlistInfo.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
          </p>
          <button 
            className="zm-btn play-all-btn" 
            onClick={() => songs.length > 0 && onPlaySong(songs[0], songs)}
            disabled={songs.length === 0}
          >
            <IoPlay /> PHÁT NGẪU NHIÊN
          </button>
        </div>
      </div>

      <div className="playlist-songs-list">
        {songs.length === 0 ? (
            <div className="no-songs">Playlist này chưa có bài hát nào.</div>
        ) : (
            songs.map((song, index) => (
            <div 
                className="playlist-song-item" 
                key={song.id} 
                onClick={() => onPlaySong(song, songs)}
            >
                <span className="song-index">{index + 1}</span>
                <div className="song-main-info">
                    <img 
                        src={song.imageUrl} 
                        alt={song.title} 
                        className="song-thumb" 
                        onError={(e) => { e.target.src = 'https://placehold.co/60x60/7a3c9e/ffffff?text=Err'; }}
                    />
                    <div className="song-text">
                        <h4>{song.title}</h4>
                        <p>{song.artists}</p>
                    </div>
                </div>
                <div className="song-actions-right">
                    {/* Có thể thêm nút tim ở đây nếu muốn */}
                    <IoHeart style={{color: 'rgba(255,255,255,0.5)'}} />
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}

export default PlaylistDetail;