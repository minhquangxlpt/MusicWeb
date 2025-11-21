import React, { useState, useCallback, useEffect, useRef } from 'react'; 
import './App.css'; 

// Import các component
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import MainContent from './components/MainContent/MainContent';
import PlayerControls from './components/PlayerControls/PlayerControls';
import AlbumDetail from './components/AlbumDetail/AlbumDetail';
import AuthModal from './components/Login/Login'; 
import PlaylistQueue from './components/PlaylistQueue/PlaylistQueue';
import FavoritesLibrary from './components/FavoritesLibrary/FavoritesLibrary'; 
import ListenHistory from './components/ListenHistory/ListenHistory'; 
import PlaylistLibrary from './components/PlaylistLibrary/PlaylistLibrary';
import PlaylistDetail from './components/PlaylistDetail/PlaylistDetail';
import AddToPlaylistModal from './components/AddToPlaylistModal/AddToPlaylistModal';
import SongActionModal from './components/SongActionModal/SongActionModal';
import UserProfile from './components/UserProfile/UserProfile';
import AdWeb from './components/AdWeb/AdWeb'; 
import VipUpgrade from './components/VipUpgrade/VipUpgrade';
import PaymentPage from './components/PaymentPage/PaymentPage';
import InvoiceHistory from './components/InvoiceHistory/InvoiceHistory';
import InvoiceDetail from './components/InvoiceDetail/InvoiceDetail';


function App() {
  // --- TRẠNG THÁI (STATE) ---
  const [currentSong, setCurrentSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // currentView có thể là: 'main', 'album', 'favorites', 'history', 'playlists', 'playlist-detail', 'profile', 'vip-upgrade', 'payment', 'invoices', 'invoice-detail'
  const [currentView, setCurrentView] = useState('main'); 
  const [selectedItemId, setSelectedItemId] = useState(null);
  
  // State UI Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlaylistQueue, setShowPlaylistQueue] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [showSongActionModal, setShowSongActionModal] = useState(false);
  
  // State Data
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState(null);
  const [songForAction, setSongForAction] = useState(null);
  const [selectedVipPackage, setSelectedVipPackage] = useState(null);

  // State Auth & User
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  // === MỚI: Ref để theo dõi thời gian nghe của bài hát hiện tại ===
  const listenTimeRef = useRef(0); 
  const lastSongIdRef = useRef(null);
  const hasRecordedHistoryRef = useRef(false); 

  // --- EFFECTS ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetch('http://localhost:5001/api/favorites', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        const favSet = new Set(data.map(song => song.id));
        setFavorites(favSet);
      })
      .catch(err => console.error("Lỗi tải yêu thích:", err));
    } else {
      setFavorites(new Set());
    }
  }, [isLoggedIn]);

  // --- LOGIC GHI NHẬN LỊCH SỬ ---
  const recordHistory = useCallback(async (songId) => {
    if (!isLoggedIn) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5001/api/history', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ songId })
      });
      console.log("Đã ghi nhận lịch sử nghe cho bài:", songId);
    } catch (error) {
      console.error("Lỗi ghi lịch sử:", error);
    }
  }, [isLoggedIn]);

  const handleTimeUpdate = useCallback((currentTime) => {
    if (!currentSong) return;

    if (currentSong.id !== lastSongIdRef.current) {
        lastSongIdRef.current = currentSong.id;
        listenTimeRef.current = 0;
        hasRecordedHistoryRef.current = false;
    }

    if (!hasRecordedHistoryRef.current && currentTime >= 30) {
        hasRecordedHistoryRef.current = true;
        recordHistory(currentSong.id);
    }
  }, [currentSong, recordHistory]);


  // --- HANDLERS ---
  const handleToggleFavorite = useCallback(async (songId) => {
    if (!isLoggedIn) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/favorites/${songId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (data.isLiked) newFavorites.add(songId);
          else newFavorites.delete(songId);
          return newFavorites;
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [isLoggedIn]);

  const handlePlaySong = useCallback((song, songList = []) => {
    listenTimeRef.current = 0;
    hasRecordedHistoryRef.current = false;
    lastSongIdRef.current = song.id;
    setCurrentSong(song);
    if (songList && songList.length > 0) {
      setPlaylist(songList);
      const index = songList.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : -1);
    } else {
      setPlaylist([song]);
      setCurrentIndex(0);
    }
  }, []);

  const handleNextSong = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    setCurrentSong(playlist[nextIndex]);
  }, [currentIndex, playlist]);

  const handlePrevSong = useCallback(() => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentSong(playlist[prevIndex]);
  }, [currentIndex, playlist]);

  const handleViewAlbum = useCallback((id) => { setSelectedItemId(id); setCurrentView('album'); }, []);
  const handleViewPlaylistDetail = useCallback((id) => { setSelectedItemId(id); setCurrentView('playlist-detail'); }, []);
  const handleViewPlaylistLibrary = useCallback(() => { setCurrentView('playlists'); setSelectedItemId(null); }, []);
  const handleViewFavorites = useCallback(() => { setCurrentView('favorites'); setSelectedItemId(null); }, []);
  const handleViewHistory = useCallback(() => { setCurrentView('history'); setSelectedItemId(null); }, []);
  const handleViewHome = useCallback(() => { setCurrentView('main'); setSelectedItemId(null); }, []);
  const handleBackToMain = useCallback(() => { setCurrentView('main'); setSelectedItemId(null); }, []);
  
  const handleLoginClick = useCallback(() => { setShowAuthModal(true); }, []);
  const handleCloseAuthModal = useCallback(() => { setShowAuthModal(false); }, []);
  const handleLoginSuccess = useCallback((userData) => { setIsLoggedIn(true); setUser(userData); setShowAuthModal(false); }, []);
  const handleLogout = useCallback(() => { setIsLoggedIn(false); setUser(null); localStorage.removeItem('token'); localStorage.removeItem('user'); setCurrentView('main'); }, []);
  const togglePlaylistQueue = useCallback(() => { setShowPlaylistQueue(prev => !prev); }, []);

  const handleOpenSongAction = useCallback((song) => { setSongForAction(song); setShowSongActionModal(true); }, []);
  
  const handleOpenAddToPlaylist = useCallback((song) => {
    if (!isLoggedIn) {
        alert("Vui lòng đăng nhập để sử dụng tính năng này");
        return;
    }
    setSongToAddToPlaylist(song);
    setShowAddToPlaylistModal(true);
  }, [isLoggedIn]);

  const handleAddToPlaylist = useCallback(async (playlistId, songId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/playlists/${playlistId}/songs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ songId })
        });
        const data = await response.json();
        if (response.ok) {
            alert("Đã thêm bài hát vào playlist thành công!");
            setShowAddToPlaylistModal(false);
            setSongToAddToPlaylist(null);
        } else {
            alert(data.error || "Lỗi khi thêm bài hát");
        }
    } catch (error) {
        alert("Lỗi kết nối server");
    }
  }, []);

  const handleBuyVipPackage = useCallback((packageInfo) => {
      setSelectedVipPackage(packageInfo);
      setCurrentView('payment'); 
  }, []);

  const handlePaymentSuccess = useCallback(() => {
      alert("Cảm ơn bạn đã nâng cấp VIP!");
      setCurrentView('main'); 
      setSelectedVipPackage(null);
  }, []);

  const handleBackFromPayment = useCallback(() => {
      setCurrentView('vip-upgrade');
      setSelectedVipPackage(null);
  }, []);

  const handleUpgradeVip = useCallback(() => {
    if (isLoggedIn) {
        setCurrentView('vip-upgrade');
        setSelectedItemId(null);
    } else {
        setShowAuthModal(true);
    }
  }, [isLoggedIn]);

  const handleChangePassword = useCallback(() => {
    alert("Chức năng Đổi mật khẩu sẽ được cập nhật sau!");
  }, []);

  const handleViewProfile = useCallback(() => {
    setCurrentView('profile');
    setSelectedItemId(null);
  }, []);

  // === SỬA: Handler Xem danh sách hóa đơn ===
  const handleViewInvoices = useCallback(() => {
    setCurrentView('invoices');
    setSelectedItemId(null);
  }, []);

  // === SỬA: Handler Xem chi tiết hóa đơn ===
  const handleViewInvoiceDetail = useCallback((invoiceId) => {
    setSelectedItemId(invoiceId);
    setCurrentView('invoice-detail');
  }, []);


  return (
    <div className="app">
      <AdWeb isLoggedIn={isLoggedIn} />

      <Sidebar 
        onLoginClick={handleLoginClick} 
        isLoggedIn={isLoggedIn}
        onViewFavorites={handleViewFavorites}
        onViewHistory={handleViewHistory}
        onViewPlaylists={handleViewPlaylistLibrary}
        onViewHome={handleViewHome}
      />
      
      <Header 
        onPlaySong={handlePlaySong}
        onShowAuthModal={handleLoginClick}
        user={user}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onChangePassword={handleChangePassword}
        onViewProfile={handleViewProfile}
        onUpgradeVip={handleUpgradeVip}
        // === SỬA: Truyền hàm xuống Header ===
        onViewInvoices={handleViewInvoices}
      /> 
      
      <PlayerControls
        currentSong={currentSong}
        onNext={handleNextSong}
        onPrev={handlePrevSong}
        onTogglePlaylist={togglePlaylistQueue}
        showPlaylistQueue={showPlaylistQueue}
        isFavorite={currentSong ? favorites.has(currentSong.id) : false}
        onToggleFavorite={() => currentSong && handleToggleFavorite(currentSong.id)}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Các Modal */}
      {showAuthModal && <AuthModal onClose={handleCloseAuthModal} onLoginSuccess={handleLoginSuccess} />}
      {showPlaylistQueue && <PlaylistQueue playlist={playlist} currentSong={currentSong} onClose={togglePlaylistQueue} onPlaySong={handlePlaySong} />}
      {showSongActionModal && songForAction && (
        <SongActionModal 
            song={songForAction}
            onClose={() => setShowSongActionModal(false)}
            onAddToPlaylist={handleOpenAddToPlaylist}
        />
      )}
      {showAddToPlaylistModal && songToAddToPlaylist && (
        <AddToPlaylistModal 
            song={songToAddToPlaylist}
            onClose={() => setShowAddToPlaylistModal(false)}
            onAddToPlaylist={handleAddToPlaylist}
        />
      )}

      <main className="main-content-wrapper">
        {currentView === 'main' && (
          <MainContent 
            onPlaySong={handlePlaySong} 
            onViewAlbum={handleViewAlbum}
            isLoggedIn={isLoggedIn}
            favorites={favorites}
            onOpenSongAction={handleOpenSongAction}
          />
        )}
        
        {currentView === 'album' && <AlbumDetail albumId={selectedItemId} onBack={handleBackToMain} onPlaySong={handlePlaySong} />}
        {currentView === 'favorites' && <FavoritesLibrary onPlaySong={handlePlaySong} />}
        {currentView === 'history' && <ListenHistory onPlaySong={handlePlaySong} />}
        {currentView === 'playlists' && <PlaylistLibrary onViewPlaylistDetail={handleViewPlaylistDetail} />}
        {currentView === 'playlist-detail' && <PlaylistDetail playlistId={selectedItemId} onBack={handleViewPlaylistLibrary} onPlaySong={handlePlaySong} />}
        {currentView === 'profile' && <UserProfile user={user} />}
        
        {currentView === 'vip-upgrade' && (
            <VipUpgrade onBuy={handleBuyVipPackage} />
        )}

        {currentView === 'payment' && selectedVipPackage && (
            <PaymentPage 
                selectedPackage={selectedVipPackage}
                onBack={handleBackFromPayment}
                onPaymentSuccess={handlePaymentSuccess}
            />
        )}

        {/* === MỚI: Render trang Lịch sử giao dịch === */}
        {currentView === 'invoices' && (
            <InvoiceHistory onViewInvoiceDetail={handleViewInvoiceDetail} />
        )}

        {/* === MỚI: Render trang Chi tiết hóa đơn === */}
        {currentView === 'invoice-detail' && (
            <InvoiceDetail 
                invoiceId={selectedItemId} 
                onBack={handleViewInvoices} 
            />
        )}
      </main>
    </div>
  );
}

export default App;