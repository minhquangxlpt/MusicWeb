const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db'); // Đảm-bảo (Ensure) file db.js của-bạn (your) tồn-tại (exists) và-được-cấu-hình (configured)

const app = express();
const PORT = process.env.PORT || 5000;

// Lưu ý: Với React app, các file trong public/ sẽ được serve bởi React dev server
// URL sẽ là relative paths: /audio/song.mp3 và /images/song/cover.jpg

app.use(cors());
app.use(express.json());

// Helper function để normalize đường dẫn file
// Files hiện tại ở: public/audio/ và public/images/song/
function normalizeFilePath(path, type) {
  if (!path) {
    return null;
  }
  
  // Remove leading/trailing whitespace
  let cleanPath = path.trim();
  
  // Remove leading slash if present
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }
  
  // Remove các prefix cũ nếu có
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = cleanPath.slice(8);
  }
  
  // Xử lý theo type
  if (type === 'audio') {
    // Nếu chưa có prefix audio/, thêm vào
    if (!cleanPath.startsWith('audio/')) {
      cleanPath = `audio/${cleanPath}`;
    }
  } else if (type === 'image') {
    // Nếu chưa có prefix images/, thêm vào
    if (!cleanPath.startsWith('images/')) {
      // Nếu chỉ có tên file (không có /), thêm images/song/
      if (!cleanPath.includes('/')) {
        cleanPath = `images/song/${cleanPath}`;
      } else {
        // Nếu đã có subfolder, chỉ thêm images/
        cleanPath = `images/${cleanPath}`;
      }
    }
  }
  
  return cleanPath;
}

// API endpoints for serving images and audio files
app.get('/api/image/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  let folder;
  if (type === 'song') {
    folder = 'song';
  } else if (type === 'artist') {
    folder = 'artists';
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }
  const filePath = path.join(__dirname, '..', 'public', 'images', folder, filename + '.jpg');

  // Check if file exists
  if (require('fs').existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

app.get('/api/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'public', 'audio', filename + '.mp3');

  // Check if file exists
  if (require('fs').existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Audio file not found' });
  }
});

// API endpoint for suggestions (popular songs with artists)
app.get('/api/suggestions', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.DuongDanAudio as audioUrl

      FROM baihat b
      JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      GROUP BY b.BaiHatID
      ORDER BY b.LuotPhat DESC
      LIMIT 3
    `);

    // Chuyển-đổi (Convert) đường-dẫn-tương-đối (relative paths) thành (into) URL
    // Files hiện tại ở: server/uploads/images/ và server/uploads/audio/
    // Server sẽ serve qua API endpoints: /api/image/:filename và /api/audio/:filename
    const fullUrlRows = rows.map(row => {
      console.log('Processing song:', row.id, '- Original imageUrl:', row.imageUrl, '- Original audioUrl:', row.audioUrl);

      const result = {
        ...row,
        // Dùng API endpoints để serve files
        imageUrl: row.imageUrl ? `http://localhost:${PORT}/api/image/song/${row.imageUrl}` : 'https://placehold.co/300x300/7a3c9e/ffffff?text=No+Image',
        audioUrl: row.audioUrl ? `http://localhost:${PORT}/api/audio/${row.audioUrl}` : null
      };

      console.log('Final result for song:', result.id, '- imageUrl:', result.imageUrl, '- audioUrl:', result.audioUrl);

      return result;
    });

    res.json(fullUrlRows); // Gửi-dữ-liệu (Send) đã-sửa (fixed data)

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for charts (top songs by play count)
app.get('/api/charts', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT b.BaiHatID as id, b.TieuDe as title,
             GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
             b.AnhBiaBaiHat as cover, b.LuotPhat as playCount,
             b.DuongDanAudio as audioUrl

      FROM baihat b
      JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
      JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
      GROUP BY b.BaiHatID
      ORDER BY b.LuotPhat DESC
      LIMIT 3
    `);

    // Thêm-URL VÀ (AND) rank
    const chartsWithRank = rows.map((item, index) => {
      return {
        ...item,
        rank: index + 1,
        cover: item.cover ? `http://localhost:${PORT}/api/image/song/${item.cover}` : 'https://placehold.co/60x60/a64883/fff?text=No+Image',
        audioUrl: item.audioUrl ? `http://localhost:${PORT}/api/audio/${item.audioUrl}` : null
      };
    });

    res.json(chartsWithRank);

  } catch (error) {
    console.error('Error fetching charts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for new albums
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

    // Chuyển-đổi (Convert) đường-dẫn-ảnh (image paths) cho (for) albums
    const fullUrlRows = rows.map(row => {
      return {
        ...row,
        imageUrl: row.imageUrl ? `http://localhost:${PORT}/api/image/song/${row.imageUrl}` : 'https://placehold.co/300x300/4a90e2/ffffff?text=No+Image'
      };
    });

    res.json(fullUrlRows); // Gửi-dữ-liệu (Send) đã-sửa (fixed data)

  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for partners (static data for now)
app.get('/api/partners', (req, res) => {
  const partners = [
    { id: 1, name: 'Universal', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Universal' },
    { id: 2, name: 'Sony Music', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Sony+Music' },
    { id: 3, name: 'FUGA', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=FUGA' },
    { id: 4, name: 'Kakao M', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Kakao+M' },
    { id: 5, name: 'Monstercat', logoUrl: 'https://placehold.co/150x80/2f2739/a0a0a0?text=Monstercat' },
  ];
  res.json(partners);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});