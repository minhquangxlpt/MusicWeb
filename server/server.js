const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db'); // Đảm bảo file db.js đã được cấu hình đúng

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'your-secret-key-123'; // Nên đặt trong biến môi trường
const BASE_URL = `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// =======================================================
// 1. CÁC TUYẾN ĐƯỜNG PHỤC VỤ FILE (STATIC FILES)
// =======================================================
app.use('/uploads', express.static(path.join(__dirname, '../public')));

// =======================================================
// 1.1 API PHỤC VỤ FILE ẢNH VÀ AUDIO
// =======================================================
// Phục vụ file audio
app.get('/api/audio/:filename', (req, res) => {
  const { filename } = req.params;
  // Thử tìm trong public/audio trước
  let filePath = path.join(__dirname, '..', 'public', 'audio', filename + '.mp3');
  if (require('fs').existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Nếu không có, thử trong uploads
    filePath = path.join(__dirname, 'uploads', 'audio', filename);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending audio file:', err);
        res.status(404).send('File not found');
      }
    });
  }
});

// Phục vụ file ảnh BÀI HÁT
app.get('/api/image/song/:filename', (req, res) => {
  const { filename } = req.params;
  // Thử tìm trong public/images/song trước
  let filePath = path.join(__dirname, '..', 'public', 'images', 'song', filename + '.jpg');
  if (require('fs').existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Nếu không có, thử trong uploads
    filePath = path.join(__dirname, 'uploads', 'images', 'song', filename);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending song image file:', err);
        res.status(404).send('File not found');
      }
    });
  }
});

// Phục vụ file ảnh ALBUM
app.get('/api/image/album/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', 'images', 'album', filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending album image file:', err);
      res.status(404).send('File not found');
    }
  });
});
// =======================================================


// =======================================================
// 2. API ĐĂNG NHẬP (LOGIN) - CẬP NHẬT THEO DB MỚI
// =======================================================
app.post('/api/login', async (req, res) => {
  try {
    // Frontend gửi lên { email, password }
    // Biến 'email' ở đây là giá trị người dùng nhập vào (có thể là Email hoặc Tên đăng nhập)
    const { email, password } = req.body; 

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập/email và mật khẩu' });
    }

    // Query bảng `nguoidung`
    // Tìm theo `Email` HOẶC `TenDangNhap`
    // (Dấu ? thứ nhất là email, dấu ? thứ hai cũng là email - để so sánh với cả 2 cột)
    const [users] = await pool.execute(
      'SELECT * FROM nguoidung WHERE Email = ? OR TenDangNhap = ?',
      [email, email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }

    const user = users[0];

    // Kiểm tra trạng thái tài khoản (nếu có cột TrangThai)
    if (user.TrangThai && user.TrangThai !== 'active') {
         return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    // Kiểm tra mật khẩu
    let isValidPassword = false;
    // 1. So sánh trực tiếp (nếu DB lưu password thô)
    if (user.MatKhau === password) {
        isValidPassword = true;
    } else {
        // 2. So sánh bcrypt (nếu DB lưu hash)
        // Catch lỗi để tránh crash nếu format hash sai
        isValidPassword = await bcrypt.compare(password, user.MatKhau).catch(() => false);
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mật khẩu không đúng' });
    }

    // Tạo Token
    const token = jwt.sign(
      { userId: user.NguoiDungID, username: user.TenDangNhap },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Trả về thông tin User
    // Mapping: 
    // - DB: HoVaTen -> Frontend: displayName
    // - DB: AnhDaiDien -> Frontend: avatar
    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.NguoiDungID,
        username: user.TenDangNhap,
        email: user.Email,
        displayName: user.TenHienThi || user.TenDangNhap, // Fallback nếu HoVaTen null
        avatar: user.AnhDaiDien
          ? (user.AnhDaiDien.startsWith('http') ? user.AnhDaiDien : `${BASE_URL}/uploads/${user.AnhDaiDien}.jpg`)
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.TenDangNhap}` // Avatar mặc định
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
});

// =======================================================
// 3. CÁC API DỮ LIỆU (CÔNG KHAI)
// =======================================================

// Gợi ý
app.get('/api/suggestions', async (req, res) => {
  try {
    // Sử dụng LEFT JOIN để đảm bảo không mất bài hát nếu thiếu thông tin phụ
    // Sử dụng IFNULL thay vì COALESCE (tương tự nhau nhưng IFNULL phổ biến hơn trong MySQL cũ)
    const [rows] = await pool.execute(`
      SELECT 
        b.BaiHatID as id, 
        b.TieuDe as title, 
        b.AnhBiaBaiHat as imageUrl,
        GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
        b.DuongDanAudio as audioUrl,
        IFNULL(b.LuotPhat, 0) as listenCount, 
        IFNULL(b.LuotThich, 0) as likeCount
      FROM baihat b
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      GROUP BY b.BaiHatID
      ORDER BY RAND()
      LIMIT 9
    `);

    const data = rows.map(row => ({
      id: row.id,
      title: row.title,
      artists: row.artists || 'Unknown Artist',
      imageUrl: row.imageUrl ? `${BASE_URL}/api/image/song/${row.imageUrl}` : 'https://placehold.co/300x300/7a3c9e/ffffff?text=No+Image',
      audioUrl: row.audioUrl ? `${BASE_URL}/api/audio/${row.audioUrl}` : null,
      listenCount: Number(row.listenCount),
      likeCount: Number(row.likeCount)
    }));
    
    res.json(data);

  } catch (error) {
    console.error('Error suggestions:', error);
    // Trả về mảng rỗng thay vì lỗi 500 để frontend không bị crash
    res.json([]); 
  }
});

// Tìm kiếm
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);
    const searchTerm = `%${query}%`;

    const [rows] = await pool.execute(`
      SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl
      FROM baihat b
      JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE b.TieuDe LIKE ? OR n.TenNgheSi LIKE ?
      GROUP BY b.BaiHatID
      ORDER BY b.LuotPhat DESC
      LIMIT 10
    `, [searchTerm, searchTerm]);

    const data = rows.map(row => ({
        ...row,
        imageUrl: row.imageUrl ? `${BASE_URL}/api/image/song/${row.imageUrl}` : 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image',
        audioUrl: row.audioUrl ? `${BASE_URL}/api/audio/${row.audioUrl}` : null
    }));
    res.json(data);
  } catch (error) {
    console.error('Error search:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Bảng xếp hạng
app.get('/api/charts', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as cover,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
                   b.DuongDanAudio as audioUrl, b.LuotPhat
            FROM baihat b
            JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
            JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
            GROUP BY b.BaiHatID
            ORDER BY b.LuotPhat DESC
            LIMIT 5
        `);
        const data = rows.map((item, index) => ({
            ...item,
            rank: index + 1,
            cover: item.cover ? `${BASE_URL}/api/image/song/${item.cover}` : 'https://placehold.co/60x60/a64883/fff?text=No+Image',
            audioUrl: item.audioUrl ? `${BASE_URL}/api/audio/${item.audioUrl}` : null
        }));
        res.json(data);
    } catch (error) {
        console.error('Error charts:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Albums
app.get('/api/albums', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT a.AlbumID as id, a.TieuDe as title, a.AnhBia as imageUrl,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists
            FROM album a
            LEFT JOIN album_nghesi an ON a.AlbumID = an.AlbumID
            LEFT JOIN nghesi n ON an.NgheSiID = n.NgheSiID
            GROUP BY a.AlbumID
            ORDER BY a.NgayPhatHanh DESC
            LIMIT 5
        `);
        const data = rows.map(row => ({
            ...row,
            imageUrl: row.imageUrl ? `${BASE_URL}/api/image/album/${row.imageUrl}` : 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'
        }));
        res.json(data);
    } catch (error) {
        console.error('Error albums:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Album Detail
app.get('/api/album/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [albumRows] = await pool.execute(`
            SELECT a.AlbumID as id, a.TieuDe as title, a.NgayPhatHanh as releaseDate, a.AnhBia as imageUrl,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists
            FROM album a
            LEFT JOIN album_nghesi an ON a.AlbumID = an.AlbumID
            LEFT JOIN nghesi n ON an.NgheSiID = n.NgheSiID
            WHERE a.AlbumID = ?
            GROUP BY a.AlbumID
        `, [id]);

        if (albumRows.length === 0) return res.status(404).json({ error: 'Album not found' });

        const [songs] = await pool.execute(`
            SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
                   b.DuongDanAudio as audioUrl
            FROM baihat b
            JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
            JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
            WHERE b.AlbumID = ?
            GROUP BY b.BaiHatID
        `, [id]);

        const albumData = {
            ...albumRows[0],
            imageUrl: albumRows[0].imageUrl ? `${BASE_URL}/api/image/album/${albumRows[0].imageUrl}` : 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'
        };
        const songData = songs.map(s => ({
            ...s,
            imageUrl: s.imageUrl ? `${BASE_URL}/api/image/song/${s.imageUrl}` : 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image',
            audioUrl: s.audioUrl ? `${BASE_URL}/api/audio/${s.audioUrl}` : null
        }));

        res.json({ album: albumData, songs: songData });
    } catch (error) {
        console.error('Error album detail:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Partners
app.get('/api/partners', (req, res) => {
    res.json([
      { id: 1, name: 'Universal', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Universal' },
      { id: 2, name: 'Sony Music', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Sony+Music' },
      { id: 3, name: 'FUGA', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=FUGA' },
      { id: 4, name: 'Kakao M', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Kakao+M' },
      { id: 5, name: 'Monstercat', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Monstercat' },
    ]);
});

// =======================================================
// 4. API NGƯỜI DÙNG (CẦN TOKEN - AUTHENTICATED)
// =======================================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Thiếu token' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token không hợp lệ' });
        req.user = user;
        next();
    });
};

// Lấy danh sách yêu thích
// Lấy danh sách yêu thích (Đã sửa lỗi SQL mode & dùng LEFT JOIN)
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // SỬA: 
    // 1. Dùng LEFT JOIN để không bị mất bài hát nếu lỡ thiếu thông tin nghệ sĩ
    // 2. Thêm các cột vào GROUP BY để tránh lỗi 'ONLY_FULL_GROUP_BY' trên MySQL mới
    const [rows] = await pool.execute(`
      SELECT b.BaiHatID as id, 
             b.TieuDe as title, 
             b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl, 
             f.NgayThem as addedDate
      FROM baihatyeuthich f
      JOIN baihat b ON f.BaiHatID = b.BaiHatID
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE f.NguoiDungID = ?
      GROUP BY b.BaiHatID, b.TieuDe, b.AnhBiaBaiHat, b.DuongDanAudio, f.NgayThem
      ORDER BY f.NgayThem DESC
    `, [userId]);

    const data = rows.map(row => ({
        ...row,
        imageUrl: row.imageUrl ? `${BASE_URL}/api/image/song/${row.imageUrl}` : 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image',
        audioUrl: row.audioUrl ? `${BASE_URL}/api/audio/${row.audioUrl}` : null
    }));
    
    res.json(data);

  } catch (error) {
    // In lỗi chi tiết ra terminal để bạn dễ sửa nếu vẫn còn lỗi
    console.error('Error fetching favorites:', error.message);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
});


// Toggle yêu thích
app.post('/api/favorites/:songId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const songId = req.params.songId;
        const [exists] = await pool.execute('SELECT * FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?', [userId, songId]);

        if (exists.length > 0) {
            await pool.execute('DELETE FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?', [userId, songId]);
            res.json({ message: 'Đã xóa', isLiked: false });
        } else {
            await pool.execute('INSERT INTO baihatyeuthich (NguoiDungID, BaiHatID) VALUES (?, ?)', [userId, songId]);
            res.json({ message: 'Đã thêm', isLiked: true });
        }
    } catch (error) {
        console.error('Error toggle favorite:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Check status yêu thích
app.get('/api/favorites/:songId/status', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM baihatyeuthich WHERE NguoiDungID = ? AND BaiHatID = ?',
            [req.user.userId, req.params.songId]
        );
        res.json({ isLiked: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi' });
    }
});

app.post('/api/playlists', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên playlist là bắt buộc' });
    }

    // SỬA: Cột 'Ten' thay vì 'TenDanhSach'
    const [result] = await pool.execute(
      'INSERT INTO danhsachphat (NguoiDungID, Ten, MoTa) VALUES (?, ?, ?)',
      [userId, name, description || '']
    );

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      createdAt: new Date()
    });

  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
});

// 2. Lấy danh sách Playlist của User
app.get('/api/playlists', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // SỬA: 
    // - Cột 'Ten' thay vì 'TenDanhSach'
    // - Bỏ 'AnhBia' vì bảng không có
    const [rows] = await pool.execute(`
      SELECT DanhSachID as id, Ten as name, MoTa as description,
             NgayTao as createdAt
      FROM danhsachphat
      WHERE NguoiDungID = ?
      ORDER BY NgayTao DESC
    `, [userId]);

    res.json(rows);

  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
});

// 3. Thêm bài hát vào Playlist
app.post('/api/playlists/:playlistId/songs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const playlistId = req.params.playlistId;
    const { songId } = req.body;

    // Kiểm tra quyền sở hữu
    const [playlist] = await pool.execute(
      'SELECT * FROM danhsachphat WHERE DanhSachID = ? AND NguoiDungID = ?',
      [playlistId, userId]
    );

    if (playlist.length === 0) {
      return res.status(404).json({ error: 'Playlist không tồn tại hoặc không có quyền' });
    }

    // Kiểm tra trùng bài
    const [existing] = await pool.execute(
      'SELECT * FROM danhsach_baihat WHERE DanhSachID = ? AND BaiHatID = ?',
      [playlistId, songId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Bài hát đã có trong playlist' });
    }

    // Lấy thứ tự
    const [maxOrder] = await pool.execute(
      'SELECT MAX(ThuTu) as maxOrder FROM danhsach_baihat WHERE DanhSachID = ?',
      [playlistId]
    );
    const nextOrder = (maxOrder[0].maxOrder || 0) + 1;

    // Thêm bài
    await pool.execute(
      'INSERT INTO danhsach_baihat (DanhSachID, BaiHatID, ThuTu) VALUES (?, ?, ?)',
      [playlistId, songId, nextOrder]
    );

    res.json({ message: 'Đã thêm bài hát vào playlist' });

  } catch (error) {
    console.error('Error adding song to playlist:', error);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
});

// 4. Lấy chi tiết Playlist (SỬA LỖI HIỂN THỊ BÀI HÁT)
app.get('/api/playlists/:playlistId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const playlistId = req.params.playlistId;

    // 1. Lấy thông tin Playlist
    const [playlistRows] = await pool.execute(`
      SELECT DanhSachID as id, Ten as name, MoTa as description,
             NgayTao as createdAt
      FROM danhsachphat
      WHERE DanhSachID = ? AND NguoiDungID = ?
    `, [playlistId, userId]);

    if (playlistRows.length === 0) {
      return res.status(404).json({ error: 'Playlist không tìm thấy hoặc bạn không có quyền truy cập' });
    }
    
    const playlistInfo = playlistRows[0];
    // Thêm ảnh bìa giả lập (hoặc lấy từ bài hát đầu tiên nếu muốn xịn hơn)
    playlistInfo.coverImage = 'https://placehold.co/300x300/2f2739/ffffff?text=' + encodeURIComponent(playlistInfo.name);

    // 2. Lấy danh sách bài hát (QUAN TRỌNG)
    // Join bảng danhsach_baihat -> baihat -> (các bảng nghệ sĩ nếu cần)
    const [songRows] = await pool.execute(`
      SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl, db.ThuTu as orderIndex
      FROM danhsach_baihat db
      JOIN baihat b ON db.BaiHatID = b.BaiHatID
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE db.DanhSachID = ?
      GROUP BY b.BaiHatID, db.ThuTu
      ORDER BY db.ThuTu ASC
    `, [playlistId]);

    const songs = songRows.map(song => ({
      ...song,
      // Xử lý đường dẫn ảnh/nhạc
      imageUrl: song.imageUrl ? `${BASE_URL}/api/image/song/${song.imageUrl}` : 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image',
      audioUrl: song.audioUrl ? `${BASE_URL}/api/audio/${song.audioUrl}` : null
    }));

    res.json({
      ...playlistInfo,
      songs // Trả về mảng bài hát
    });

  } catch (error) {
    console.error('Error playlist detail:', error);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
});

app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.execute(`
      SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl, h.ThoiGianNghe as playedAt
      FROM lichsunghe h
      JOIN baihat b ON h.BaiHatID = b.BaiHatID
      LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      WHERE h.NguoiDungID = ?
      GROUP BY h.LichSuID
      ORDER BY h.ThoiGianNghe DESC
      LIMIT 50
    `, [userId]);

    const history = rows.map(row => ({
      ...row,
      imageUrl: row.imageUrl ? `${BASE_URL}/api/image/song/${row.imageUrl}` : 'https://placehold.co/60x60/7a3c9e/ffffff?text=No+Image',
      audioUrl: row.audioUrl ? `${BASE_URL}/api/audio/${row.audioUrl}` : null
    }));
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// API THÊM LỊCH SỬ (SỬA LẠI CHO CHÍNH XÁC)
app.post('/api/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { songId } = req.body;

    if (!songId) {
        return res.status(400).json({ error: 'Thiếu songId' });
    }

    // Thêm bản ghi mới vào lịch sử
    // Lưu ý: Bảng lichsunghe của bạn có LichSuID tự tăng, ThoiGianNghe mặc định là CURRENT_TIMESTAMP
    await pool.execute(
      'INSERT INTO lichsunghe (NguoiDungID, BaiHatID) VALUES (?, ?)',
      [userId, songId]
    );
    
    res.json({ message: 'Đã thêm vào lịch sử' });
  } catch (error) {
    console.error('Error adding to history:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// =======================================================
// 5. API QUẢNG CÁO & KIỂM TRA QUYỀN (MỚI)
// =======================================================
// API Kiểm tra trạng thái gói cước (Đã nâng cấp)
app.get('/api/user/subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Tìm gói cước đang active và còn hạn
    const [rows] = await pool.execute(`
      SELECT dk.DangKyID, dk.NgayHetHan, g.Ten as TenGoi, q.KhongQuangCao
      FROM dangkygoi dk
      JOIN goicuoc g ON dk.GoiID = g.GoiID
      JOIN quyentruycap q ON g.QuyenID = q.QuyenID
      WHERE dk.NguoiDungID = ?
        AND dk.TrangThai = 'active'
        AND (dk.NgayHetHan IS NULL OR dk.NgayHetHan > NOW())
      ORDER BY dk.NgayHetHan DESC
      LIMIT 1
    `, [userId]);

    if (rows.length > 0) {
        const sub = rows[0];
        // Tính số ngày còn lại
        const now = new Date();
        const expiryDate = new Date(sub.NgayHetHan);
        const diffTime = Math.abs(expiryDate - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        // Logic hiển thị tên gói
        let displayName = sub.TenGoi;
        // Nếu là gói VIP (có quyền KhongQuangCao), bạn có thể đổi tên hiển thị thành "Premium" nếu muốn
        if (sub.KhongQuangCao === 1) {
            displayName = "Premium"; 
        }

        res.json({
            isVip: sub.KhongQuangCao === 1,
            planName: displayName, // Trả về tên đã xử lý
            expiryDate: sub.NgayHetHan,
            daysLeft: diffDays
        });
    } else {
        // Không có gói nào
        res.json({
            isVip: false,
            planName: 'Miễn Phí',
            expiryDate: null,
            daysLeft: 0
        });
    }

  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});
// API Kiểm tra quyền "Không Quảng Cáo"
app.get('/api/user/check-ads', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Tìm xem user có gói cước nào active và có quyền KhongQuangCao = 1
    const [rows] = await pool.execute(`
      SELECT dk.DangKyID
      FROM dangkygoi dk
      JOIN goicuoc g ON dk.GoiID = g.GoiID
      JOIN quyentruycap q ON g.QuyenID = q.QuyenID
      WHERE dk.NguoiDungID = ?
        AND dk.TrangThai = 'active'
        AND (dk.NgayHetHan IS NULL OR dk.NgayHetHan > NOW())
        AND q.KhongQuangCao = 1
      LIMIT 1
    `, [userId]);

    const isVip = rows.length > 0;
    // Log để debug
    console.log(`Check VIP User ${userId}: ${isVip}`); 

    res.json({ isVip });

  } catch (error) {
    console.error('Error checking ads permission:', error);
    // Nếu lỗi, trả về false để an toàn (hoặc true nếu muốn tránh làm phiền user khi lỗi)
    res.json({ isVip: false });
  }
});

// API Lấy link quảng cáo
app.get('/api/ads/random', async (req, res) => {
  try {
    // Đảm bảo bảng quangcao có dữ liệu HienThi = 1
    const [rows] = await pool.execute(
      'SELECT LinkShopee FROM quangcao WHERE HienThi = 1 ORDER BY RAND() LIMIT 1'
    );

    if (rows.length > 0) {
      console.log('Ad found:', rows[0].LinkShopee); // Log debug
      res.json({ link: rows[0].LinkShopee });
    } else {
      console.log('No ads found in DB, using fallback'); // Log debug
      // Link dự phòng nếu DB trống
      res.json({ link: 'https://shopee.vn' }); 
    }
  } catch (error) {
    console.error('Error getting ad:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});
// API GÓI CƯỚC & THANH TOÁN (VIP)
// =======================================================

// 1. Lấy danh sách gói cước VIP để hiển thị
app.get('/api/vip-packages', async (req, res) => {
  try {
    // Giả sử QuyenID = 2 là quyền VIP (như trong dữ liệu mẫu của bạn)
    const [rows] = await pool.execute(`
      SELECT GoiID as id, Ten as name, Gia as price, ThoiHan as duration, MoTa as description
      FROM goicuoc
      WHERE QuyenID = 2  -- Chỉ lấy gói VIP
      ORDER BY Gia ASC
    `);

    // Format lại dữ liệu cho đẹp nếu cần
    const packages = rows.map(pkg => ({
        ...pkg,
        formattedPrice: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.price),
        features: [ // Tạm thời hardcode các tính năng hiển thị, hoặc bạn có thể thêm bảng 'tinhnang_goi' sau này
            "Nghe nhạc chất lượng Lossless",
            "Không quảng cáo làm phiền",
            "Tải nhạc không giới hạn"
        ],
        isRecommended: pkg.duration === 180 // Ví dụ: Gói 6 tháng là recommended
    }));

    res.json(packages);

  } catch (error) {
    console.error('Error fetching vip packages:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 2. Xử lý Thanh Toán & Đăng Ký Gói (Cập nhật logic chuẩn chỉnh)
// API THANH TOÁN & ĐĂNG KÝ GÓI VIP (ĐÃ SỬA LỖI NGÀY HẾT HẠN)
app.post('/api/payment/process', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction(); 

    const userId = req.user.userId;
    const { packageId, packageName, paymentMethod, price } = req.body; // Thêm price nếu cần

    // 1. Lấy thông tin gói cước từ DB
    const [packages] = await connection.execute('SELECT * FROM goicuoc WHERE GoiID = ?', [packageId]);
    if (packages.length === 0) {
        throw new Error("Gói cước không tồn tại");
    }
    const selectedPackage = packages[0];
    const amount = selectedPackage.Gia;
    const durationDays = selectedPackage.ThoiHan;

    // 2. Tạo Hóa Đơn
    const [billResult] = await connection.execute(
      'INSERT INTO hoadon (NguoiDungID, TongTien, TrangThai, NgayLap) VALUES (?, ?, ?, NOW())',
      [userId, amount, 'paid']
    );
    const billId = billResult.insertId;

    // 3. Tạo Chi Tiết Hóa Đơn
    await connection.execute(
      'INSERT INTO chitiethoadon (HoaDonID, GoiID, SoTien, MoTa) VALUES (?, ?, ?, ?)',
      [billId, selectedPackage.GoiID, amount, `Đăng ký ${selectedPackage.Ten} qua ${paymentMethod}`]
    );

    // 4. Xử lý Đăng Ký Gói (SỬA LỖI LOGIC Ở ĐÂY)
    
    // Kiểm tra xem user đang có gói nào CÒN HẠN không (active và chưa hết hạn)
    const [existingSub] = await connection.execute(
      "SELECT * FROM dangkygoi WHERE NguoiDungID = ? AND TrangThai = 'active' AND NgayHetHan > NOW() ORDER BY NgayHetHan DESC LIMIT 1",
      [userId]
    );

    let newStartDate = new Date();
    let newEndDate = new Date();

    if (existingSub.length > 0) {
        // TRƯỜNG HỢP 1: Đang có gói còn hạn -> Cộng dồn thời gian
        // Lấy ngày hết hạn hiện tại làm mốc bắt đầu cộng thêm
        const currentEndDate = new Date(existingSub[0].NgayHetHan);
        
        // Logic cộng ngày an toàn:
        newEndDate = new Date(currentEndDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        
        console.log(`User ${userId} gia hạn thêm ${durationDays} ngày. Hết hạn cũ: ${currentEndDate.toISOString()}, Mới: ${newEndDate.toISOString()}`);
        
        // Tùy chọn: Có thể update gói cũ thành 'extended' hoặc chỉ đơn giản là insert gói mới nối tiếp
        // Ở đây ta chọn insert gói mới để lưu lịch sử rõ ràng
    } else {
        // TRƯỜNG HỢP 2: Chưa có gói hoặc gói cũ đã hết hạn -> Tính từ thời điểm hiện tại (NOW)
        // newStartDate là NOW()
        newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + durationDays);
        
        console.log(`User ${userId} đăng ký mới ${durationDays} ngày. Hết hạn: ${newEndDate.toISOString()}`);
    }

    // Chuyển đổi ngày sang format MySQL (YYYY-MM-DD HH:mm:ss) để tránh lỗi format
    const formatDateMySQL = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
    
    // Insert bản ghi đăng ký mới
    await connection.execute(
      'INSERT INTO dangkygoi (NguoiDungID, GoiID, NgayDangKy, NgayHetHan, TrangThai) VALUES (?, ?, NOW(), ?, ?)',
      [userId, selectedPackage.GoiID, formatDateMySQL(newEndDate), 'active'] 
    );

    // (Tùy chọn) Nếu bạn có cột QuyenID trong bảng NguoiDung (để cache quyền), hãy update nó ở đây
    // Nhưng theo database chuẩn hóa, quyền được check qua bảng dangkygoi -> goicuoc -> quyentruycap
    // Nên không cần update bảng NguoiDung.

    await connection.commit(); 
    res.json({ success: true, message: 'Thanh toán thành công! Bạn đã là thành viên VIP.' });

  } catch (error) {
    await connection.rollback();
    console.error('Payment Error:', error);
    res.status(500).json({ error: error.message || 'Lỗi xử lý thanh toán' });
  } finally {
    connection.release();
  }
});

// API LẤY DANH SÁCH HÓA ĐƠN CỦA USER
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Lấy danh sách hóa đơn, sắp xếp mới nhất trước
    const [rows] = await pool.execute(`
      SELECT HoaDonID as id, NgayLap as date, TongTien as totalAmount, TrangThai as status
      FROM hoadon
      WHERE NguoiDungID = ?
      ORDER BY NgayLap DESC
    `, [userId]);

    // Format lại dữ liệu nếu cần (ví dụ format tiền tệ ở frontend hoặc ở đây)
    res.json(rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// API LẤY CHI TIẾT HÓA ĐƠN
app.get('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const userId = req.user.userId;

    // 1. Lấy thông tin chung hóa đơn (đảm bảo đúng chủ sở hữu)
    const [invoiceRows] = await pool.execute(`
      SELECT HoaDonID as id, NgayLap as date, TongTien as totalAmount, TrangThai as status
      FROM hoadon
      WHERE HoaDonID = ? AND NguoiDungID = ?
    `, [invoiceId, userId]);

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Hóa đơn không tồn tại hoặc không có quyền truy cập' });
    }
    const invoice = invoiceRows[0];

    // 2. Lấy chi tiết hóa đơn (items)
    // Join với bảng goicuoc để lấy tên gói (nếu cần)
    const [detailRows] = await pool.execute(`
      SELECT c.ChiTietID as id, c.SoTien as amount, c.MoTa as description, 
             g.Ten as packageName
      FROM chitiethoadon c
      LEFT JOIN goicuoc g ON c.GoiID = g.GoiID
      WHERE c.HoaDonID = ?
    `, [invoiceId]);

    res.json({ ...invoice, items: detailRows });

  } catch (error) {
    console.error('Error fetching invoice detail:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// KHỞI ĐỘNG SERVER
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại: ${BASE_URL}`);
});