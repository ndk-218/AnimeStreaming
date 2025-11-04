# 👤 USER PROFILE API DOCUMENTATION

## Base URL
```
http://localhost:5000/api/user/profile
```

## Authentication
All endpoints require Bearer Token in header:
```
Authorization: Bearer <access_token>
```

---

## 📋 ENDPOINTS

### 1. Get Profile
**GET** `/api/user/profile`

**Description:** Lấy thông tin profile của user hiện tại

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "673c1234567890abcdef1234",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatar": "/uploads/images/avatars/avatar_673c1234_1730123456789_abc123def456.webp",
    "gender": "Nam",
    "isPremium": false,
    "premiumExpiry": null,
    "isEmailVerified": true,
    "isActive": true,
    "favorites": [],
    "watchHistory": [],
    "createdAt": "2024-11-01T10:30:00.000Z",
    "updatedAt": "2024-11-01T10:30:00.000Z"
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "error": "No token provided"
}
```

---

### 2. Update Profile
**PUT** `/api/user/profile`

**Description:** Cập nhật thông tin profile (displayName, gender)

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "displayName": "John Doe Updated",
  "gender": "Nam"
}
```

**Field Details:**
- `displayName` (optional): String, không được rỗng
- `gender` (optional): Enum - "Nam" | "Nữ" | "Không xác định"

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "673c1234567890abcdef1234",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe Updated",
    "gender": "Nam",
    "avatar": "/uploads/images/avatars/avatar_673c1234_1730123456789_abc123def456.webp",
    "isPremium": false,
    "isEmailVerified": true,
    "createdAt": "2024-11-01T10:30:00.000Z",
    "updatedAt": "2024-11-01T11:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Display name cannot be empty"
}
```

```json
{
  "success": false,
  "error": "Invalid gender value"
}
```

---

### 3. Update Avatar
**POST** `/api/user/profile/avatar`

**Description:** Upload/Update avatar (resize về 128x128px WebP)

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body (multipart/form-data):**
```
avatar: [File] (JPEG, PNG, WebP - Max 5MB)
```

**Example using Axios:**
```javascript
const formData = new FormData();
formData.append('avatar', file); // File from input[type="file"]

const response = await axios.post(
  'http://localhost:5000/api/user/profile/avatar',
  formData,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "avatar": "/uploads/images/avatars/avatar_673c1234_1730123456789_abc123def456.webp"
  },
  "message": "Avatar updated successfully"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "No image file provided"
}
```

```json
{
  "success": false,
  "error": "Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP)"
}
```

**Notes:**
- Avatar tự động resize về 128x128px
- Convert sang WebP format (quality 90%)
- Avatar cũ sẽ bị xóa tự động
- Lưu vào: `uploads/images/avatars/`

---

### 4. Delete Avatar
**DELETE** `/api/user/profile/avatar`

**Description:** Xóa avatar hiện tại và revert về default avatar

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Avatar removed successfully"
}
```

**Response Error (401):**
```json
{
  "success": false,
  "error": "No token provided"
}
```

**Notes:**
- Avatar hiện tại sẽ bị xóa khỏi server
- User avatar sẽ về `/assets/default-avatar.png`

---

## 🔐 CHANGE PASSWORD

### Change Password (Authenticated User)
**POST** `/api/users/auth/change-password`

**Description:** Đổi mật khẩu cho user đã đăng nhập (yêu cầu verify old password)

**Headers:**
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Validation:**
- `currentPassword`: Required, min 6 characters
- `newPassword`: Required, min 6 characters

**Response Success (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

**Notes:**
- Sau khi đổi mật khẩu, refresh token sẽ bị invalidate
- User phải đăng nhập lại với mật khẩu mới

---

## 📧 FORGOT PASSWORD FLOW

### 1. Request Password Reset
**POST** `/api/users/auth/forgot-password`

**Description:** Gửi email reset password link

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link will be sent."
}
```

**Notes:**
- Email sẽ chứa link reset với token (expire trong 1 giờ)
- Format link: `http://localhost:5173/reset-password?token=abc123...`

---

### 2. Reset Password with Token
**POST** `/api/users/auth/reset-password`

**Description:** Reset password bằng token từ email

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "token": "abc123def456...",
  "newPassword": "NewPassword123"
}
```

**Validation:**
- `token`: Required
- `newPassword`: Required, min 6 characters

**Response Success (200):**
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

**Notes:**
- Token chỉ valid trong 1 giờ
- Sau reset, tất cả sessions cũ bị invalidate

---

## 🖼️ AVATAR URL FORMAT

### Access Avatar Files
Avatars được serve từ backend static folder:

**Example:**
```
http://localhost:5000/uploads/images/avatars/avatar_673c1234_1730123456789_abc123def456.webp
```

### In Frontend (React):
```jsx
// Construct full URL
const BACKEND_URL = 'http://localhost:5000';
const avatarUrl = user.avatar.startsWith('/assets') 
  ? user.avatar // Default avatar (từ frontend assets)
  : `${BACKEND_URL}${user.avatar}`; // Uploaded avatar

<img src={avatarUrl} alt={user.displayName} />
```

---

## 🔄 COMMON ERROR RESPONSES

### 401 Unauthorized
```json
{
  "success": false,
  "error": "No token provided"
}
```
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 📝 FRONTEND INTEGRATION EXAMPLE

### Update Profile Form
```javascript
import axios from 'axios';

const updateProfile = async (displayName, gender, accessToken) => {
  try {
    const response = await axios.put(
      'http://localhost:5000/api/user/profile',
      { displayName, gender },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Profile updated:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Update failed:', error.response?.data?.error);
    throw error;
  }
};
```

### Upload Avatar Form
```javascript
import axios from 'axios';

const uploadAvatar = async (file, accessToken) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await axios.post(
      'http://localhost:5000/api/user/profile/avatar',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('Avatar uploaded:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Upload failed:', error.response?.data?.error);
    throw error;
  }
};
```

### Change Password Modal
```javascript
import axios from 'axios';

const changePassword = async (currentPassword, newPassword, accessToken) => {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/users/auth/change-password',
      { currentPassword, newPassword },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Password changed:', response.data);
    // Redirect to login page
    window.location.href = '/login';
    
  } catch (error) {
    console.error('Change password failed:', error.response?.data?.error);
    throw error;
  }
};
```

---

## ✅ TESTING CHECKLIST

- [ ] Get profile - Authenticated
- [ ] Get profile - No token (401)
- [ ] Update displayName only
- [ ] Update gender only
- [ ] Update both displayName + gender
- [ ] Update with empty displayName (error)
- [ ] Update with invalid gender (error)
- [ ] Upload avatar - JPEG
- [ ] Upload avatar - PNG
- [ ] Upload avatar - WebP
- [ ] Upload avatar - Invalid format (error)
- [ ] Upload avatar - Too large >5MB (error)
- [ ] Delete avatar
- [ ] Change password - Correct old password
- [ ] Change password - Wrong old password (error)
- [ ] Forgot password - Send email
- [ ] Reset password - Valid token
- [ ] Reset password - Expired token (error)

---

**Last Updated:** November 2024  
**API Version:** 1.0.0
