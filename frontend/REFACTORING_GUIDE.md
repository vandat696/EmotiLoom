# Frontend Refactoring - EmotiLoom

## 📁 Cấu Trúc Thư Mục Mới

```
src/
├── components/              # Các component tái sử dụng
│   ├── LoginForm.jsx       # Form đăng nhập
│   ├── RegisterForm.jsx    # Form đăng ký
│   ├── Sidebar.jsx         # Sidebar navigation
│   ├── ChatMessage.jsx     # Component tin nhắn
│   ├── ChatBox.jsx         # Hộp chat
│   ├── MoodSelector.jsx    # Selector tâm trạng
│   └── index.js            # Re-exports
├── pages/                   # Các trang chính
│   ├── HomePage.jsx        # Trang chủ
│   ├── DiaryPage.jsx       # Trang nhật ký
│   ├── AIChatPage.jsx      # Trang trò chuyện AI
│   ├── AppointmentsPage.jsx # Trang lịch hẹn
│   ├── CommunityPage.jsx   # Trang cộng đồng
│   └── index.js            # Re-exports
├── services/                # API services
│   └── api.js              # Tất cả API calls
├── utils/                   # Utility functions
├── constants/              # Constants
│   └── index.js            # Moods, roles, sections
├── theme/                  # Material-UI theme
│   └── index.js            # Theme configuration
├── App.jsx                 # Main app component
├── index.js                # Entry point
├── index.css               # Global styles
└── App.css                 # App styles (minimal)
```

## 🎨 Material-UI Integration

Ứng dụng hiện đã sử dụng Material-UI (MUI) cho tất cả styling. Các lợi ích:

- **Consistent Design**: Giao diện thống nhất trên toàn ứng dụng
- **Responsive**: Tự động responsive trên tất cả thiết bị
- **Accessible**: Tuân thủ WCAG accessibility standards
- **Themed**: Hỗ trợ theme tùy chỉnh qua `theme/index.js`

## 📦 Dependencies

```json
{
  "@mui/material": "^5.x",
  "@emotion/react": "^11.x",
  "@emotion/styled": "^11.x",
  "@mui/icons-material": "^5.x"
}
```

## 🚀 Cách Chạy Ứng Dụng

### Development
```bash
cd frontend
npm install
npm start
```

### Production Build
```bash
npm run build
npm run serve # hoặc dùng serve package
```

## 📝 Thay Đổi Chính

### Trước và Sau

**Trước (Old Structure):**
- `App.js` - Monolithic component (>400 lines)
- `MessageChat.js` - Standalone file
- Styling dùng custom CSS
- Không có folder organization

**Sau (New Structure):**
- `App.jsx` - Clean entry point
- Chia thành components & pages
- Sử dụng Material-UI cho styling
- Organized theo feature folders
- Service layer cho API calls
- Theme centralization

## 🔧 API Service Configuration

Tất cả API calls được centralize trong `src/services/api.js`:

```javascript
import { 
  authService, 
  diaryService, 
  aiService, 
  appointmentService, 
  messageService, 
  communityService 
} from './services/api';

// Sử dụng
const response = await diaryService.getEntries();
const messages = await messageService.getMessages(appointmentId);
```

## 🎨 Theme Customization

Chỉnh sửa `src/theme/index.js` để thay đổi theme:

```javascript
palette: {
  primary: {
    main: '#6366F1',      // Màu chính
    light: '#818CF8',
    dark: '#4F46E5',
  },
  secondary: {
    main: '#EC4899',      // Màu phụ
  },
  // ...
}
```

## 📱 Component Usage

### Login Form
```jsx
import { LoginForm } from './components';

<LoginForm onLoginSuccess={handleLogin} />
```

### Diary Page
```jsx
import { DiaryPage } from './pages';

<DiaryPage />
```

### Chat Box
```jsx
import { ChatBox } from './components';

<ChatBox 
  appointmentId="123"
  otherUserName="Dr. Smith"
  currentUser={user}
  onClose={handleClose}
/>
```

## 🔐 Authentication Flow

1. User logs in → `LoginForm.jsx`
2. Token saved to localStorage
3. `App.jsx` checks token on mount
4. Sidebar shows after authentication
5. Logout clears token and redirects

## 📡 API Endpoints

Xem `src/services/api.js` cho danh sách tất cả endpoints:

- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `GET /api/diary` - Lấy nhật ký
- `POST /api/diary` - Tạo nhật ký
- `POST /api/ai/chat` - Chat với AI
- `GET /api/appointments` - Lấy lịch hẹn
- `POST /api/messages/:id` - Gửi tin nhắn
- `GET /api/community` - Lấy posts cộng đồng

## 🔄 State Management

Hiện tại sử dụng React's built-in `useState`. Nếu cần complex state management, có thể cân nhắc:

- Redux
- Zustand
- Context API

## 🧪 Testing

Để thêm unit tests:

```bash
npm test
```

Test files nên được đặt cùng thư mục với components:

```
src/
├── components/
│   ├── LoginForm.jsx
│   ├── LoginForm.test.jsx  ← Test file
│   └── ...
```

## 🐛 Troubleshooting

### Material-UI icons không hiển thị
```bash
npm install @mui/icons-material
```

### CSS modules conflict
- App.css giờ chỉ có minimal CSS
- Material-UI handles all styling
- Không cần import CSS trong components

### API connection issues
- Check `.env` file có `REACT_APP_API_URL`
- Xác nhận backend server chạy
- Kiểm tra CORS settings

## 📚 Resources

- [Material-UI Documentation](https://mui.com/)
- [React Documentation](https://react.dev/)
- [Emotion CSS-in-JS](https://emotion.sh/)

## 🎯 Next Steps

Để tiếp tục cải thiện:

1. **Form Validation**: Thêm validation libraries (Formik, React Hook Form)
2. **State Management**: Thêm Redux/Context nếu state phức tạp
3. **Error Handling**: Thêm error boundary components
4. **Loading States**: Thêm skeleton screens
5. **Notifications**: Thêm toast/snackbar notifications
6. **Testing**: Thêm unit & integration tests

---

**Version**: 1.0.0  
**Last Updated**: Jan 2025  
**Framework**: React 19 + Material-UI v5
