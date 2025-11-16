import React, { useState, useEffect } from 'react';
import './PlayerControls.css'; // Đảm-bảo (Make sure) bạn-đã-nhập (you import) file CSS

// Nhập (Import) các-icon (icons) từ-thư-viện (library) react-icons
import {
  IoExpand,
  IoHeartOutline,
  IoEllipsisHorizontal,
  IoShuffleOutline,
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoPlay,
  IoPause,
  IoRepeatOutline,
  IoVolumeMediumOutline,
  IoMicOutline,
  IoListOutline,
} from 'react-icons/io5';

function PlayerControls({ currentSong }) {
  const [isPlaying, setIsPlaying] = useState(false); // Trạng-thái (State) ví-dụ (example)
  const [progress, setProgress] = useState(0); // Trạng-thái (State) ví-dụ (example)
  const [volume, setVolume] = useState(80); // Trạng-thái (State) ví-dụ (example)
  const [audio, setAudio] = useState(null); // Audio element

  // Effect to handle audio when currentSong changes
  useEffect(() => {
    if (currentSong && currentSong.audioUrl) {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = ''; // Clear previous audio source
      }
      const newAudio = new Audio(currentSong.audioUrl);
      newAudio.volume = volume / 100;
      
      // Handle audio loading errors
      newAudio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
        console.error('Audio URL:', currentSong.audioUrl);
      });
      
      // Handle audio loaded
      newAudio.addEventListener('loadeddata', () => {
        console.log('Audio loaded successfully:', currentSong.audioUrl);
      });
      
      setAudio(newAudio);
      setIsPlaying(false);
      setProgress(0);
      
      // Cleanup function
      return () => {
        if (newAudio) {
          newAudio.pause();
          newAudio.src = '';
        }
      };
    } else if (!currentSong) {
      // Clean up audio when no song is selected
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        setAudio(null);
      }
    }
  }, [currentSong]);

  // Effect to handle play/pause
  useEffect(() => {
    if (audio) {
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, audio]);

  // Effect to handle volume changes
  useEffect(() => {
    if (audio) {
      audio.volume = volume / 100;
    }
  }, [volume, audio]);

  // Handle play/pause toggle
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="player-controls">
      {/* --- 1. Khối Bên Trái (Thông tin bài hát) --- */}
      <div className="player-left">
        <div className="song-cover">
          <img
            src={currentSong ? (currentSong.cover || currentSong.imageUrl || 'https://placehold.co/60x60/a64883/fff?text=No+Image') : 'https://placehold.co/60x60/a64883/fff?text=No+Song'}
            alt="Song Cover"
            onError={(e) => {
              console.error('Error loading song cover:', currentSong?.cover || currentSong?.imageUrl);
              e.target.src = 'https://placehold.co/60x60/a64883/fff?text=No+Image';
            }}
          />
          <div className="cover-icon">
            <IoExpand />
          </div>
        </div>
        <div className="song-info">
          <div className="song-name">{currentSong ? currentSong.title : 'Chọn bài hát'}</div>
          <div className="artist-name">{currentSong ? currentSong.artists : 'Nghệ sĩ'}</div>
        </div>
        <div className="song-actions">
          <button className="player-btn icon-btn">
            <IoHeartOutline />
          </button>
          <button className="player-btn icon-btn">
            <IoEllipsisHorizontal />
          </button>
        </div>
      </div>

      {/* --- 2. Khối Ở Giữa (Nút điều khiển & Thanh tiến trình) --- */}
      <div className="player-center">
        <div className="player-controls-buttons">
          <button className="player-btn icon-btn">
            <IoShuffleOutline />
          </button>
          <button className="player-btn icon-btn">
            <IoPlaySkipBack />
          </button>
          <button
            className="player-btn icon-btn play-pause-btn"
            onClick={handlePlayPause}
          >
            {isPlaying ? <IoPause /> : <IoPlay />}
          </button>
          <button className="player-btn icon-btn">
            <IoPlaySkipForward />
          </button>
          <button className="player-btn icon-btn">
            <IoRepeatOutline />
          </button>
        </div>

        <div className="progress-bar-container">
          <span className="time-label">02:13</span>
          <div className="progress-bar">
            <input
              type="range"
              className="progress-slider"
              min="0"
              max="100"
              step="1"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              style={{ '--progress-percent': `${progress}%` }}
            />
          </div>
          <span className="time-label">04:43</span>
        </div>
      </div>

      {/* --- 3. Khối Bên Phải (Chất lượng, Âm lượng, Lời, Danh sách) --- */}
      <div className="player-right">
        <button className="player-btn quality-btn">128kbps</button>
        <button className="player-btn icon-btn">
          <IoVolumeMediumOutline />
        </button>
        <div className="volume-slider-container">
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="100"
            step="1"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            style={{ '--progress-percent': `${volume}%` }}
          />
        </div>
        <span className="divider"></span>
        <button className="player-btn icon-btn">
          <IoMicOutline />
        </button>
        <button className="player-btn icon-btn">
          <IoListOutline />
        </button>
      </div>
    </div>
  );
}

export default PlayerControls;