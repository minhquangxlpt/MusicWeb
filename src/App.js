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
import AdminLayout from './components/Admin/AdminLayout/AdminLayout';
import Dashboard from './components/Admin/Dashboard/Dashboard';
import SongManager from './components/Admin/SongManager/SongManager';
import UserManager from './components/Admin/UserManager/UserManager';
import AlbumManager from './components/Admin/AlbumManager/AlbumManager'; 
import AlbumLibrary from './components/AlbumLibrary/AlbumLibrary';


function App() {
  // --- TRẠNG THÁI (STATE) ---
  const [currentSong, setCurrentSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
// Thêm state view cho Admin
  const [adminView, setAdminView] = useState('dashboard');

  // currentView có thể là: 'main', 'album', 'favorites'
  const [currentView, setCurrentView] = useState('main');   
  // Trạng thái UI
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlaylistQueue, setShowPlaylistQueue] = useState(false);

  // Trạng thái Đăng nhập
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null); 

  // State lưu gói VIP đang chọn để thanh toán
  const [selectedVipPackage, setSelectedVipPackage] = useState(null);

  // Trạng thái yêu thích (quản lý tập trung tại App)
  const [favorites, setFavorites] = useState(new Set());

  // === MỚI: Ref để theo dõi thời gian nghe của bài hát hiện tại ===
  // Dùng ref để không gây re-render
  const listenTimeRef = useRef(0); 
  const lastSongIdRef = useRef(null);
  const hasRecordedHistoryRef = useRef(false); // Đã ghi nhận cho bài này chưa?

  // State cho Modal thêm vào playlist
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState(null);
// === MỚI: State cho Modal Tùy chọn bài hát ===
  const [showSongActionModal, setShowSongActionModal] = useState(false);
  const [songForAction, setSongForAction] = useState(null);

  // --- EFFECTS ---
  // Kiểm tra đăng nhập khi load trang
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setIsLoggedIn(true);
      setUser(parsedUser);
      
      // Nếu là admin, chuyển thẳng vào dashboard khi reload (tùy chọn)
    if (parsedUser.role === 'admin') setCurrentView('admin-dashboard');
    }
  }, []);

  // Tải danh sách yêu thích khi đăng nhập
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

  // Handler xem thư viện Album (từ Sidebar)
  const handleViewAlbumLibrary = useCallback(() => {
    setCurrentView('albums');
    setSelectedItemId(null);
  }, []);
  // Hàm được gọi mỗi giây từ PlayerControls
  const handleTimeUpdate = useCallback((currentTime) => {
    if (!currentSong) return;

    // Nếu đổi bài hát, reset bộ đếm
    if (currentSong.id !== lastSongIdRef.current) {
        lastSongIdRef.current = currentSong.id;
        listenTimeRef.current = 0;
        hasRecordedHistoryRef.current = false;
    }

    // Tăng thời gian nghe (giả định hàm này gọi mỗi ~0.2-1s)
    // Tuy nhiên, currentTime là thời gian thực của bài hát. 
    // Để đơn giản, ta so sánh currentTime > 30s (nếu người dùng tua qua 30s thì cũng tính)
    // HOẶC chuẩn hơn: dùng setInterval đếm giây thực tế. 
    // Ở đây tôi dùng cách đơn giản: Nếu bài hát chạy đến giây thứ 30 -> Ghi nhận.
    
    if (!hasRecordedHistoryRef.current && currentTime >= 30) {
        hasRecordedHistoryRef.current = true;
        recordHistory(currentSong.id);
    }
  }, [currentSong, recordHistory]);

// Hàm render nội dung Admin
  const renderAdminContent = () => {
      switch (adminView) {
          case 'dashboard': return <Dashboard />;
          case 'songs': return <SongManager />;
          // case 'albums': return <AlbumManager />;
          // case 'users': return <UserManager />;
          default: return <Dashboard />;
      }
  };
  

  // --- HÀM XỬ LÝ LOGIC (HANDLERS) ---
  
  // === VIP & PAYMENT HANDLERS ===
  
  // 1. Handler khi bấm "Mua Ngay"
  const handleBuyVipPackage = useCallback((packageInfo) => {
      setSelectedVipPackage(packageInfo);
      setCurrentView('payment'); // Chuyển sang trang thanh toán
  }, []);

  // 2. Handler khi thanh toán thành công
  const handlePaymentSuccess = useCallback(() => {
      alert("Cảm ơn bạn đã nâng cấp VIP!");
      setCurrentView('main'); 
      setSelectedVipPackage(null);
  }, []);

  // 3. Handler quay lại từ trang thanh toán
  const handleBackFromPayment = useCallback(() => {
      setCurrentView('vip-upgrade');
      setSelectedVipPackage(null);
  }, []);

  // 4. Handler mở trang nâng cấp VIP từ Header
  const handleUpgradeVip = useCallback(() => {
    if (isLoggedIn) {
        setCurrentView('vip-upgrade');
        setSelectedItemId(null);
    } else {
        setShowAuthModal(true);
    }
  }, [isLoggedIn]);
    // Handler Xem danh sách hóa đơn
  const handleViewInvoices = useCallback(() => {
    setCurrentView('invoices');
    setSelectedItemId(null);
  }, []);

  // Handler Xem chi tiết hóa đơn
  const handleViewInvoiceDetail = useCallback((invoiceId) => {
    setSelectedItemId(invoiceId);
    setCurrentView('invoice-detail');
  }, []);
  // 1. Xử lý yêu thích
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


  // 2. Xử lý phát nhạc
  const handlePlaySong = useCallback((song, songList = []) => {
    // Reset trạng thái lịch sử khi chọn bài mới
    listenTimeRef.current = 0;
    hasRecordedHistoryRef.current = false;
    lastSongIdRef.current = song.id;
    setCurrentSong(song);
    if (songList.length > 0) {
      setPlaylist(songList);
      const index = songList.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : -1);
    } else {
      // Nếu không có danh sách, tạo danh sách chỉ có 1 bài
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

  // 3. Xử lý điều hướng (Navigation)
  const handleViewAlbum = useCallback((albumId) => {
    setSelectedItemId(albumId);
    setCurrentView('album');
  }, []);
  
  const handleViewFavorites = useCallback(() => {
    setCurrentView('favorites');
    setSelectedItemId(null);
  }, []);

  // Handler xem danh sách Playlist
  const handleViewPlaylistLibrary = useCallback(() => {
    setCurrentView('playlists');
    setSelectedItemId(null);
  }, []);

  // Handler xem chi tiết Playlist
  const handleViewPlaylistDetail = useCallback((playlistId) => {
    setSelectedItemId(playlistId);
    setCurrentView('playlist-detail');
  }, []);
  const handleViewHistory = useCallback(() => {
    setCurrentView('history');
    setSelectedItemId(null);
  }, []);

  const handleViewHome = useCallback(() => {
    setCurrentView('main');
    setSelectedItemId(null);
  }, []);

  const handleBackToMain = useCallback(() => {
    setCurrentView('main');
    setSelectedItemId(null);
  }, []);
  // Handler Đổi mật khẩu
  const handleChangePassword = useCallback(() => {
    alert("Chức năng Đổi mật khẩu sẽ được cập nhật sau!");
    // Hoặc set state để mở modal đổi mật khẩu
  }, []);
// Hàm chuyển sang trang thông tin tài khoản
  const handleViewProfile = useCallback(() => {
    setCurrentView('profile');
    setSelectedItemId(null);
  }, []);
  // 4. Xử lý Đăng nhập/Modal
  const handleLoginClick = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  const handleCloseAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

const handleUpdateUser = useCallback((updatedUserData) => {
      // Cập nhật state
      setUser(prev => ({ ...prev, ...updatedUserData }));
      // Cập nhật localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const newUser = { ...currentUser, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

 const handleLoginSuccess = useCallback((userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    setShowAuthModal(false);

    if (userData.role === 'admin') {
        setCurrentView('admin-dashboard'); // Chuyển sang Admin
    } else {
        setCurrentView('main'); // Chuyển sang User trang chủ
    }
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('main'); // Về trang chủ khi logout
    
    // Dừng nhạc khi logout (tùy chọn)
    setCurrentSong(null);
    setPlaylist([]);
  }, []);

  // 5. Xử lý Danh sách phát (Queue)
  const togglePlaylistQueue = useCallback(() => {
    setShowPlaylistQueue(currentValue => !currentValue); 
  }, []);

  // 1. Hàm mở bảng Tùy chọn (3 chấm)
  const handleOpenSongAction = useCallback((song) => {
    setSongForAction(song);
    setShowSongActionModal(true);
  }, []);

  // 2. Hàm mở bảng Thêm vào Playlist (được gọi từ bảng Tùy chọn)
  const handleOpenAddToPlaylist = useCallback((song) => {
    // Logic này có thể giữ nguyên hoặc dùng lại logic cũ
    if (!isLoggedIn) {
        alert("Vui lòng đăng nhập để sử dụng tính năng này");
        return;
    }
    setSongToAddToPlaylist(song);
    setShowAddToPlaylistModal(true);
  }, [isLoggedIn]);

  // 3. Hàm thực hiện thêm vào playlist
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
  // === RENDER ADMIN VIEW ===
  // Nếu currentView bắt đầu bằng 'admin-' và user là admin
  if (currentView.startsWith('admin-')) {
      if (!user || user.role !== 'admin') {
          // Bảo mật cơ bản: nếu không phải admin mà cố vào, đá về trang chủ
          setCurrentView('main');
          return null;
      }

      return (
          <AdminLayout 
              currentView={currentView.replace('admin-', '')} // dashboard, songs
              onNavigate={(view) => setCurrentView(`admin-${view}`)}
              onLogout={handleLogout}
          >
              {currentView === 'admin-dashboard' && <Dashboard />}
              {currentView === 'admin-songs' && <SongManager />}
              {currentView === 'admin-users' && <UserManager />}
              {currentView === 'admin-albums' && <AlbumManager />}

              {/* Thêm các trang admin khác ở đây */}
          </AdminLayout>
      );
  }
  

 // === RENDER USER VIEW (Mặc định) ===  
  return (
    <div className="app">
      
      <AdWeb isLoggedIn={isLoggedIn} />

      <Sidebar 
        onLoginClick={handleLoginClick} 
        isLoggedIn={isLoggedIn}
        onViewAlbums={handleViewAlbumLibrary}
        onViewFavorites={handleViewFavorites}
        onViewPlaylists={handleViewPlaylistLibrary}
        onViewHistory={handleViewHistory}
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
        onViewInvoices={handleViewInvoices}
      /> 
      
      <PlayerControls
        currentSong={currentSong}
        onNext={handleNextSong}
        onPrev={handlePrevSong}
        onTogglePlaylist={togglePlaylistQueue} // Hàm bật/tắt queue
        showPlaylistQueue={showPlaylistQueue}  // Trạng thái để highlight nút
        isFavorite={currentSong ? favorites.has(currentSong.id) : false}
        onToggleFavorite={() => currentSong && handleToggleFavorite(currentSong.id)}
        onTimeUpdate={handleTimeUpdate}
        onOpenSongAction={handleOpenSongAction}
      />

      {/* Modal Đăng nhập */}
      {showAuthModal && (
        <AuthModal 
          onClose={handleCloseAuthModal} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}

      {/* Sidebar Danh sách phát - PHẦN QUAN TRỌNG ĐỂ HIỆN DANH SÁCH NHẠC */}
      {showPlaylistQueue && (
        <PlaylistQueue
          playlist={playlist}
          currentSong={currentSong}
          onClose={togglePlaylistQueue}
          onPlaySong={handlePlaySong} 
        />
      )}

      {/* === MỚI: Render Modal Tùy Chọn === */}
      {showSongActionModal && songForAction && (
        <SongActionModal 
            song={songForAction}
            onClose={() => setShowSongActionModal(false)}
            isFavorite={favorites.has(songForAction.id)}
            onToggleFavorite={handleToggleFavorite}
            onAddToPlaylist={handleOpenAddToPlaylist} // Chuyển tiếp sang modal thêm playlist
        />
      )}

      {/* === MỚI: Render Modal Thêm vào Playlist === */}
      {showAddToPlaylistModal && songToAddToPlaylist && (
        <AddToPlaylistModal 
            song={songToAddToPlaylist}
            onClose={() => setShowAddToPlaylistModal(false)}
            onAddToPlaylist={handleAddToPlaylist}
        />
      )}

      {/* Nội dung chính */}
      <main className="main-content-wrapper">
        {currentView === 'main' && (
          <MainContent 
            onPlaySong={handlePlaySong} 
            onViewAlbum={handleViewAlbum}
            isLoggedIn={isLoggedIn}
            favorites={favorites} // Truyền xuống nếu cần dùng để hiển thị trạng thái
            // onToggleFavorite đã chuyển xuống PlayerControls nên có thể không cần ở đây nữa
            // trừ khi bạn muốn nút tim xuất hiện lại trên danh sách bài hát
            onAddToPlaylist={handleOpenAddToPlaylist}
            onOpenSongAction={handleOpenSongAction}
          />
        )}
        {currentView === 'albums' && (
            <AlbumLibrary onViewAlbum={handleViewAlbum} />
        )}

        {currentView === 'album' && (
          <AlbumDetail
            albumId={selectedItemId}
            onBack={handleBackToMain}
            onPlaySong={handlePlaySong}
            onAddToPlaylist={handleOpenAddToPlaylist}
          />
        )}
        
        {currentView === 'favorites' && (
          <FavoritesLibrary 
            onPlaySong={handlePlaySong}
            onAddToPlaylist={handleOpenAddToPlaylist}
            onOpenSongAction={handleOpenSongAction}
          />
        )}

        {/* Trang Nâng cấp VIP */}
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

        {currentView === 'history' && (
            <ListenHistory 
              onPlaySong={handlePlaySong} 
              onAddToPlaylist={handleOpenAddToPlaylist}
            />
            
        )}
        {/* === MỚI: Render trang Playlist Library === */}
        {currentView === 'playlists' && (
            <PlaylistLibrary onViewPlaylistDetail={handleViewPlaylistDetail} />
        )}

        {/* === MỚI: Render trang Chi tiết Playlist === */}
        {currentView === 'playlist-detail' && (
            <PlaylistDetail 
                playlistId={selectedItemId} // Dùng selectedItemId
                onBack={handleViewPlaylistLibrary} // Back về danh sách playlist
                onPlaySong={handlePlaySong}
                onAddToPlaylist={handleOpenAddToPlaylist}
            />
        )}
        {currentView === 'profile' && (
          <UserProfile 
              user={user} 
              onUpdateUser={handleUpdateUser} // Truyền hàm này xuống
          />
        )}
        
      </main>
    </div>
  );
}

export default App;