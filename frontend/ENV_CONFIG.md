# Environment Variables Configuration

## Frontend (.env)

Tạo file `.env` trong thư mục `frontend/`:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000
```

## Development vs Production

### Development (Local)
```env
VITE_API_URL=http://localhost:5000
```

### Production (VPS/Cloud)
```env
VITE_API_URL=https://api.yourproject.online
```

### Production (Cloudflare Tunnel)
```env
VITE_API_URL=https://api.animeplatform.online
```

## Setup Instructions

### 1. Copy Example File
```bash
cd frontend
cp .env.example .env
```

### 2. Edit Values
```bash
# Windows
notepad .env

# Linux/Mac
nano .env
```

### 3. Restart Dev Server
```bash
npm run dev
```

## Usage in Code

### ✅ ĐÚNG - Dùng Environment Variable
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = `${API_BASE_URL}/api`
```

### ❌ SAI - Hardcode URL
```javascript
const API_URL = 'http://localhost:5000/api'  // KHÔNG LÀM THẾ NÀY!
```

## Files Đã Được Sửa

1. ✅ `src/services/api.js` - Main API client
2. ✅ `src/services/authService.js` - Auth API
3. ✅ `src/services/chatService.js` - Chat API (đã đúng từ trước)

## Verify Configuration

```bash
# Check .env file
cat frontend/.env

# Test API connection
npm run dev
# Mở browser console, check Network tab
# Tất cả requests nên đi đến URL trong VITE_API_URL
```

## Troubleshooting

### Lỗi: API calls vẫn đi localhost:5000
**Nguyên nhân:** Chưa restart dev server sau khi đổi .env

**Giải pháp:**
```bash
# Stop server (Ctrl+C)
# Start lại
npm run dev
```

### Lỗi: VITE_API_URL is undefined
**Nguyên nhân:** Tên biến sai hoặc thiếu prefix `VITE_`

**Giải pháp:** 
- Vite chỉ expose biến có prefix `VITE_`
- Đảm bảo tên là `VITE_API_URL` (không phải `API_URL`)

### Lỗi: CORS error in production
**Nguyên nhân:** Backend chưa allow frontend domain

**Giải pháp:** Cập nhật CORS trong backend:
```javascript
// backend/src/server.js
app.use(cors({
  origin: [
    'http://localhost:5173',           // Dev
    'https://yourproject.online',      // Production frontend
    'https://api.yourproject.online'   // Production API
  ]
}))
```

## Security Notes

1. ⚠️ **KHÔNG commit `.env` file lên Git**
   - File `.env` đã có trong `.gitignore`
   - Chỉ commit `.env.example`

2. ⚠️ **KHÔNG hardcode sensitive data**
   - API keys, secrets → `.env`
   - URLs → `.env`

3. ✅ **Luôn dùng fallback value**
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
   //                                              ^^^^^^^^^^^^^^^^^^^^^^^^
   //                                              Fallback cho dev
   ```
