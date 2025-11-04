# 🧪 USER PROFILE TESTING GUIDE - FRONTEND

## 🚀 Start Application

### **1. Start Backend:**
```bash
cd D:\DoAn\backend
npm start
```
Server sẽ chạy tại: `http://localhost:5000`

### **2. Start Frontend:**
```bash
cd D:\DoAn\frontend
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:5173`

---

## 📋 Test Flow

### **Step 1: Đăng ký tài khoản mới**

1. Vào homepage: `http://localhost:5173`
2. Click "Đăng Nhập" ở header
3. Chuyển sang tab "Đăng Ký"
4. Điền thông tin:
   - Email: `test@gmail.com`
   - Username: `testuser`
   - Display Name: `Test User`
   - Password: `123456`
5. Click "Đăng Ký"
6. Kiểm tra email verification (nếu có)

---

### **Step 2: Đăng nhập**

1. Login với:
   - Email/Username: `test@gmail.com` hoặc `testuser`
   - Password: `123456`
2. Sau khi login, bạn sẽ thấy avatar tròn và username ở header

---

### **Step 3: Vào Profile Page**

**Cách 1:** Click vào avatar ở header → Dropdown menu → "Trang cá nhân"

**Cách 2:** Truy cập trực tiếp: `http://localhost:5173/profile`

---

### **Step 4: Test Update Profile**

#### **A. Update Display Name**
1. Thay đổi "Tên hiển thị": `New Test Name`
2. Click "Cập nhật"
3. ✅ Kiểm tra: Thông báo "Cập nhật thông tin thành công!"
4. ✅ Kiểm tra: Username trong header đã đổi

#### **B. Update Gender**
1. Chọn giới tính: Nam / Nữ / Không xác định
2. Click "Cập nhật"
3. ✅ Kiểm tra: Thông báo success
4. ✅ Reload page → Gender vẫn giữ nguyên

---

### **Step 5: Test Avatar Upload**

#### **A. Upload Avatar Mới**
1. Click vào avatar hoặc button "Đổi ảnh"
2. Chọn file ảnh (JPEG/PNG/WebP, max 5MB)
3. ✅ Kiểm tra: Avatar preview thay đổi ngay lập tức
4. ✅ Kiểm tra: Avatar trong header cũng đổi
5. ✅ Kiểm tra: Reload page → Avatar vẫn giữ

**Test Cases:**
- ✅ Upload JPEG
- ✅ Upload PNG
- ✅ Upload WebP
- ❌ Upload GIF (should show error)
- ❌ Upload file >5MB (should show error)

#### **B. Delete Avatar**
1. Click button "Xóa ảnh"
2. Confirm xóa
3. ✅ Kiểm tra: Avatar về default
4. ✅ Kiểm tra: Header cũng về default avatar

---

### **Step 6: Test Change Password**

1. Click "Đổi mật khẩu" → Popup hiện ra
2. Điền:
   - Mật khẩu cũ: `123456`
   - Mật khẩu mới: `654321`
   - Xác nhận: `654321`
3. Click "Đổi mật khẩu"
4. ✅ Alert: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại"
5. ✅ Tự động logout và redirect về homepage
6. ✅ Login lại với password mới `654321` → Success

**Error Cases:**
- ❌ Sai mật khẩu cũ → Error: "Current password is incorrect"
- ❌ Mật khẩu mới < 6 ký tự → Error: "Mật khẩu mới phải có ít nhất 6 ký tự"
- ❌ Confirm không khớp → Error: "Mật khẩu xác nhận không khớp"

---

### **Step 7: Test Avatar Display Across Pages**

1. Update avatar trong profile
2. ✅ Check header avatar (immediate update)
3. ✅ Navigate sang page khác và back → Avatar vẫn hiển thị
4. ✅ Reload page → Avatar persist
5. ✅ Logout và login lại → Avatar vẫn đúng

---

## 🖼️ Avatar URL Testing

### **Check Avatar URLs in DevTools**

**Default Avatar:**
```
/assets/default-avatar.png
```

**Uploaded Avatar:**
```
http://localhost:5000/uploads/images/avatars/avatar_673c1234_1730123456789_abc123def456.webp
```

### **Verify Avatar Processing**
1. Upload ảnh 1920x1080px
2. Check backend folder: `D:\DoAn\backend\uploads\images\avatars\`
3. ✅ File mới tạo: `avatar_[userId]_[timestamp]_[random].webp`
4. ✅ Kích thước: 128x128px
5. ✅ Format: WebP
6. ✅ Ảnh cũ đã bị xóa (nếu không phải default)

---

## 🔐 Authentication Flow Testing

### **A. Protected Route**
1. Logout
2. Try access `http://localhost:5173/profile`
3. ✅ Should redirect to homepage (unauthenticated)

### **B. Token Persistence**
1. Login
2. Close browser
3. Open browser again
4. Visit homepage
5. ✅ Still logged in (token persisted in localStorage)
6. ✅ Can access `/profile` without login again

### **C. Session Invalidation**
1. Change password
2. ✅ Logout automatically
3. ✅ Old access token invalidated
4. ✅ Must login again with new password

---

## 🐛 Common Issues & Solutions

### **Issue 1: Avatar không hiển thị**
**Check:**
- Backend server đang chạy?
- Avatar path đúng format?
- CORS enabled?
- File tồn tại trong `backend/uploads/images/avatars/`?

**Fix:**
```javascript
// In ProfilePage.jsx - Check avatarUrl construction
const avatarUrl = user.avatar.startsWith('/assets')
  ? user.avatar
  : `${BACKEND_URL}${user.avatar}`;
```

---

### **Issue 2: Upload avatar failed**
**Check:**
- File size < 5MB?
- File type: JPEG/PNG/WebP?
- Sharp package installed? (`npm install sharp`)
- Folder permissions: `backend/uploads/images/avatars/`

**Fix:**
```bash
# Recreate folder
cd D:\DoAn\backend
mkdir -p uploads\images\avatars
```

---

### **Issue 3: Profile không update**
**Check:**
- Access token valid?
- Backend route mounted đúng?
- Console errors?

**Debug:**
```javascript
// Check token
console.log('Token:', localStorage.getItem('user-access-token'));

// Check user state
console.log('User:', useAuthStore.getState().user);
```

---

## ✅ Complete Test Checklist

### **Profile Display**
- [ ] Avatar hiển thị đúng (default hoặc uploaded)
- [ ] Display name hiển thị
- [ ] Email hiển thị (read-only)
- [ ] Gender hiển thị
- [ ] Premium badge (if applicable)

### **Profile Update**
- [ ] Update display name → Success
- [ ] Update gender → Success
- [ ] Empty display name → Error
- [ ] Invalid gender → Error
- [ ] Changes reflected in header
- [ ] Changes persist after reload

### **Avatar Management**
- [ ] Upload JPEG → Success (128x128 WebP)
- [ ] Upload PNG → Success
- [ ] Upload WebP → Success
- [ ] Upload invalid type → Error
- [ ] Upload >5MB → Error
- [ ] Delete avatar → Revert to default
- [ ] Old avatar deleted from server
- [ ] Avatar shown in header immediately

### **Password Management**
- [ ] Change password (correct old) → Success + Logout
- [ ] Change password (wrong old) → Error
- [ ] New password < 6 chars → Error
- [ ] Confirm mismatch → Error
- [ ] Login with new password → Success
- [ ] Old password rejected

### **Navigation & Auth**
- [ ] Profile route protected
- [ ] Redirect to home if not logged in
- [ ] Link from header dropdown works
- [ ] Logout clears session
- [ ] Token persists in localStorage
- [ ] Refresh token auto-refresh (if 401)

---

## 📸 Expected Screenshots

### **1. Profile Page (Default Avatar)**
- Avatar: Round circle with default image
- Form: displayName, email (disabled), gender radio buttons
- Buttons: "Cập nhật", "Đổi ảnh", "Đổi mật khẩu"

### **2. Profile Page (Custom Avatar)**
- Avatar: User uploaded image (128x128)
- Buttons: "Đổi ảnh", "Xóa ảnh"

### **3. Change Password Modal**
- Fields: Mật khẩu cũ, Mật khẩu mới, Xác nhận
- Buttons: "Đổi mật khẩu", "Đóng"

### **4. Header (Logged In)**
- Avatar dropdown with:
  - User info (name, email, premium badge)
  - "Trang cá nhân"
  - "Cài đặt"
  - "Đăng xuất"

---

## 🎯 Success Criteria

✅ **All profile operations work without errors**  
✅ **Avatar upload & display functional**  
✅ **Password change works + auto logout**  
✅ **Changes persist across page reloads**  
✅ **Protected routes work correctly**  
✅ **No console errors**  
✅ **Responsive design works on mobile**  

---

**Happy Testing!** 🚀

Nếu có bug, hãy note lại:
1. Step nào bị lỗi
2. Error message (console + UI)
3. Screenshot (nếu cần)
