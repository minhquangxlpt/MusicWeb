import React, { useState, useEffect } from 'react';
import './PlayerControls.css'; 

import {
  IoExpand, IoHeartOutline, IoHeart, 
  IoEllipsisHorizontal, IoShuffleOutline,
  IoPlaySkipBack, IoPlaySkipForward, IoPlay, IoPause, IoRepeatOutline,
  IoVolumeMediumOutline, IoVolumeMuteOutline, IoVolumeLowOutline,
  IoMicOutline, IoListOutline,
} from 'react-icons/io5';

function PlayerControls({ currentSong, onNext, onPrev, onTogglePlaylist, showPlaylistQueue, isFavorite, onToggleFavorite, onTimeUpdate }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [audio, setAudio] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); 
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(80);
  const [showLyrics, setShowLyrics] = useState(false);

  // --- LOGIC AUDIO (Giữ nguyên) ---
  useEffect(() => {
    if (currentSong && currentSong.audioUrl) {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = ''; 
      }
      const newAudio = new Audio(currentSong.audioUrl);
      newAudio.volume = volume / 100;
      
      newAudio.addEventListener('loadeddata', () => {
        setDuration(newAudio.duration);
        setIsPlaying(true); 
      });

      newAudio.addEventListener('timeupdate', () => {
        const current = newAudio.currentTime;
        const total = newAudio.duration;
        setCurrentTime(current);
        setProgress(total ? (current / total) * 100 : 0);
        if (onTimeUpdate) {
            onTimeUpdate(current);
        }
      });

      newAudio.addEventListener('ended', () => {
        if (repeatMode === 2) {
          newAudio.currentTime = 0;
          newAudio.play();
        } else if (onNext) { 
          onNext();
        } else {
          setIsPlaying(false);
          setProgress(0);
        }
      });
      
      setAudio(newAudio);
      setProgress(0);
      
      return () => {
        if (newAudio) {
          newAudio.pause();
          newAudio.src = '';
          newAudio.removeEventListener('loadeddata', () => {});
          newAudio.removeEventListener('timeupdate', () => {});
          newAudio.removeEventListener('ended', () => {});
        }
      };
    } else if (!currentSong) {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
    }
  }, [currentSong, onNext, repeatMode]); 

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

  useEffect(() => {
    if (audio) {
      audio.volume = volume / 100;
    }
  }, [volume, audio]);

  const handlePlayPause = () => {
    if (audio) setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e) => {
    if (audio) {
      const newProgress = e.target.value;
      setProgress(newProgress);
      audio.currentTime = (newProgress / 100) * duration;
    }
  };

  const handleShuffle = () => setIsShuffled(!isShuffled);
  const handleRepeat = () => setRepeatMode((prev) => (prev + 1) % 3);
  const handlePrev = () => {
    if (audio && audio.currentTime > 3) audio.currentTime = 0;
    else if (onPrev) onPrev();
  };
  const handleNext = () => { if (onNext) onNext(); };

  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMute = () => {
    if (isMuted) {
      const newVolume = previousVolume > 0 ? previousVolume : 80;
      setVolume(newVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume); 
      setVolume(0);
      setIsMuted(true);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="player-controls">
      <div className="player-left">
        <div className="song-cover">
          <img
            src={currentSong ? (currentSong.cover || currentSong.imageUrl || 'https://placehold.co/60x60/a64883/fff?text=No+Image') : 'https://placehold.co/60x60/130c1c/fff?text=NCT'}
            alt="Song Cover"
            onError={(e) => {
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
          {/* Nút Yêu thích */}
          <button 
            className={`player-btn icon-btn ${isFavorite ? 'active' : ''}`}
            onClick={onToggleFavorite}
            disabled={!currentSong}
            title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
             {isFavorite ? <IoHeart className="heart-active" /> : <IoHeartOutline />}
          </button>
        
          <button className="player-btn icon-btn">
            <IoEllipsisHorizontal />
          </button>
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls-buttons">
          <button className={`player-btn icon-btn ${isShuffled ? 'active' : ''}`} onClick={handleShuffle}>
            <IoShuffleOutline />
          </button>
          <button className="player-btn icon-btn" onClick={handlePrev}>
            <IoPlaySkipBack />
          </button>
          <button className="player-btn icon-btn play-pause-btn" onClick={handlePlayPause} disabled={!audio}>
            {isPlaying ? <IoPause /> : <IoPlay />}
          </button>
          <button className="player-btn icon-btn" onClick={handleNext}>
            <IoPlaySkipForward />
          </button>
          <button className={`player-btn icon-btn ${repeatMode > 0 ? 'active' : ''}`} onClick={handleRepeat}>
            <IoRepeatOutline />
            {repeatMode === 2 && <span className="repeat-one">1</span>}
          </button>
        </div>

        <div className="progress-bar-container">
          <span className="time-label">{formatTime(currentTime)}</span>
          <div className="progress-bar">
            <input
              type="range"
              className="progress-slider"
              min="0" max="100" step="0.1"
              value={progress || 0}
              onChange={handleProgressChange}
              style={{ '--progress-percent': `${progress || 0}%` }}
              disabled={!audio}
            />
          </div>
          <span className="time-label">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-right">
        <button className="player-btn quality-btn">128kbps</button>
        <button className="player-btn icon-btn" onClick={handleMute}>
          {isMuted || Math.round(volume) === 0 ? <IoVolumeMuteOutline /> : volume < 50 ? <IoVolumeLowOutline /> : <IoVolumeMediumOutline />}
        </button>
        <div className="volume-slider-container">
          <input
            type="range" className="volume-slider" min="0" max="100" step="1"
            value={volume} onChange={handleVolumeChange}
            style={{ '--progress-percent': `${volume}%` }}
          />
        </div>
        <span className="divider"></span>
        <button className={`player-btn icon-btn ${showLyrics ? 'active' : ''}`} onClick={() => setShowLyrics(!showLyrics)}>
          <IoMicOutline />
        </button>
        {/* Nút Danh sách phát */}
        <button className={`player-btn icon-btn ${showPlaylistQueue ? 'active' : ''}`} onClick={onTogglePlaylist}>
          <IoListOutline />
        </button>
      </div>

      {showLyrics && (
        <div className="lyrics-panel">
          <div className="lyrics-header">
            <h3>Lời bài hát</h3>
            <button onClick={() => setShowLyrics(false)}>×</button>
          </div>
          <div className="lyrics-content">
            <p>Lời bài hát sẽ được hiển thị ở đây...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerControls;