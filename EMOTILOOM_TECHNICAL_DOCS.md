# EmotiLoom — Tài Liệu Kỹ Thuật & Hướng Dẫn Sử Dụng

---

## 1. Tổng Quan Sản Phẩm

**EmotiLoom** là nền tảng web hỗ trợ sức khỏe tinh thần học đường tích hợp trí tuệ nhân tạo (AI). Hệ thống cho phép học sinh ghi nhật ký cảm xúc, nhận phân tích tâm lý tức thì từ AI, kết nối với nhà tham vấn chuyên nghiệp, tham gia cộng đồng chia sẻ, và theo dõi hành trình cảm xúc qua lịch trực quan. Nhà trường có thể theo dõi tổng quan sức khỏe tinh thần toàn trường qua Dashboard riêng biệt.

---

## 2. Kiến Trúc Hệ Thống

### 2.1 Mô Hình Tổng Thể

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                    │
│              React 18 + Material UI + Axios              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────────┐
│                   BACKEND SERVER                         │
│           Node.js + Express 5 + Socket.IO                │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  REST API    │  │  WebSocket   │  │  AI Engine    │  │
│  │  /api/*      │  │  Socket.IO   │  │  Google Gemini│  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ mysql2
┌────────────────────────▼────────────────────────────────┐
│                   DATABASE                               │
│                   MySQL 8.0                              │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Công Nghệ Sử Dụng

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Frontend | React | 18.3.1 |
| UI Library | Material UI (MUI) | 7.3.9 |
| HTTP Client | Axios | 1.13.6 |
| Real-time | Socket.IO Client | 4.8.3 |
| Backend | Node.js + Express | Express 5.2.1 |
| Real-time Server | Socket.IO | 4.8.3 |
| Database | MySQL | 8.0 |
| ORM/Query | mysql2 | 3.18.2 |
| AI Engine | Google Gemini | @google/genai 1.43.0 |
| Authentication | JWT (jsonwebtoken) | 9.0.3 |
| Password Hash | bcryptjs | 3.0.3 |
| Container | Docker + Docker Compose | — |

---

## 3. Cấu Trúc Dự Án

```
EmotiLoom/
├── backend/
│   ├── controllers/
│   │   ├── AuthController.js        # Đăng ký, đăng nhập, JWT
│   │   ├── DiaryController.js       # Nhật ký + phân tích AI + calendar
│   │   ├── AIChatController.js      # Chat với AI Gemini
│   │   ├── AppointmentController.js # Lịch hẹn + chat tham vấn
│   │   └── CommunityController.js   # Bài đăng, bình luận, like
│   ├── middleware/
│   │   └── AuthMiddleware.js        # Xác thực JWT
│   ├── models/
│   │   ├── Database.js              # Singleton MySQL connection pool
│   │   └── Users.js
│   ├── routes/
│   │   └── index.js                 # Định nghĩa tất cả routes
│   ├── server.js                    # Entry point + WebSocket handler
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/AuthPage.jsx         # Đăng nhập / Đăng ký
│   │   │   ├── shared/
│   │   │   │   ├── HomePage.jsx          # Trang chủ
│   │   │   │   ├── AIChatPage.jsx        # Chat AI
│   │   │   │   └── CommunityPage.jsx     # Cộng đồng
│   │   │   ├── student/
│   │   │   │   ├── DiaryPage.jsx         # Nhật ký + Calendar
│   │   │   │   └── AppointmentsPage.jsx  # Đặt lịch hẹn
│   │   │   ├── counselor/
│   │   │   │   └── ManagementPage.jsx    # Quản lý ca tham vấn
│   │   │   └── admin/
│   │   │       └── AdminDashboard.jsx    # Dashboard nhà trường
│   │   ├── services/api.js               # Axios API calls
│   │   ├── App.js                        # Root component + routing
│   │   └── index.css                     # Global styles
│   └── package.json
├── docker-compose.yml
└── .env
```

---

## 4. Cơ Sở Dữ Liệu

### 4.1 Sơ Đồ Bảng

```
users
├── id (PK)
├── username (UNIQUE)
├── password (bcrypt)
├── role: 'student' | 'counselor' | 'admin'
└── created_at

counselor_profiles
├── id (PK)
├── user_id (FK → users)
├── full_name
├── specialty
├── experience_years
├── bio
└── is_available

diaries
├── id (PK)
├── user_id (FK → users)
├── title
├── content
├── mood_emoji
├── mood_score (1–5)
├── sentiment        ← AI phân tích
├── ai_score         ← AI phân tích
├── ai_advice        ← AI phân tích
└── created_at

ai_chats
├── id (PK)
├── user_id (FK → users)
├── role: 'user' | 'assistant'
├── content
└── created_at

appointments
├── id (PK)
├── student_id (FK → users)
├── counselor_id (FK → users)
├── appointment_date
├── appointment_time
├── status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
├── note
└── created_at

messages
├── id (PK)
├── appointment_id (FK → appointments)
├── sender_id (FK → users)
├── content
└── created_at

posts
├── id (PK)
├── user_id (FK → users)
├── content
├── tag: 'chia-se' | 'hoi-dap' | 'chuyen-gia'
└── created_at

comments
├── id (PK)
├── post_id (FK → posts)
├── user_id (FK → users)
├── content
└── created_at

likes
├── id (PK)
├── post_id (FK → posts)
├── user_id (FK → users)
└── UNIQUE(post_id, user_id)
```

---

## 5. API Endpoints

### 5.1 Xác Thực

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập, nhận JWT |

### 5.2 Nhật Ký Cảm Xúc

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/diary` | Lấy danh sách nhật ký |
| POST | `/api/diary` | Tạo nhật ký + phân tích AI |
| DELETE | `/api/diary/:id` | Xóa nhật ký |
| GET | `/api/diary/calendar` | Dữ liệu calendar theo tháng |
| GET | `/api/diary/statistics` | Thống kê mood theo tháng |

### 5.3 AI Chat

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/ai-chat` | Gửi tin nhắn, nhận phản hồi AI |
| GET | `/api/ai-chat/history` | Lấy lịch sử chat |
| DELETE | `/api/ai-chat/history` | Xóa lịch sử chat |

### 5.4 Lịch Hẹn & Tham Vấn

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/counselors` | Danh sách nhà tham vấn |
| PUT | `/api/counselors/profile` | Cập nhật hồ sơ tham vấn |
| POST | `/api/appointments` | Đặt lịch hẹn |
| GET | `/api/appointments` | Xem lịch hẹn của mình |
| PUT | `/api/appointments/:id/status` | Cập nhật trạng thái lịch hẹn |
| POST | `/api/messages` | Gửi tin nhắn trong lịch hẹn |
| GET | `/api/messages/:appointment_id` | Lấy tin nhắn của lịch hẹn |

### 5.5 Cộng Đồng

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/posts` | Danh sách bài đăng |
| POST | `/api/posts` | Tạo bài đăng |
| DELETE | `/api/posts/:id` | Xóa bài đăng |
| GET | `/api/posts/:post_id/comments` | Lấy bình luận |
| POST | `/api/comments` | Thêm bình luận |
| POST | `/api/likes` | Toggle like |

### 5.6 WebSocket Events (Socket.IO)

| Event | Hướng | Mô tả |
|---|---|---|
| `join_appointment` | Client → Server | Tham gia phòng chat của lịch hẹn |
| `send_message` | Client → Server | Gửi tin nhắn |
| `receive_message` | Server → Client | Nhận tin nhắn real-time |

---

## 6. Luồng Hoạt Động AI

```
Học sinh ghi nhật ký
        │
        ▼
Backend nhận content
        │
        ▼
Gọi Google Gemini API
Prompt: "Phân tích cảm xúc: {content}
         Trả về JSON: {sentiment, score, advice}"
        │
        ▼
Gemini trả về JSON
{
  "sentiment": "lo lắng",
  "score": 4,
  "advice": "Hãy thử hít thở sâu..."
}
        │
        ▼
Lưu vào DB + trả về frontend
        │
        ▼
Hiển thị kết quả trên thẻ nhật ký
```

Nếu không có `GEMINI_API_KEY`, hệ thống tự động dùng fallback dựa trên `mood_score` để đảm bảo prototype vẫn chạy được.

---

## 7. Hướng Dẫn Cài Đặt & Chạy

### 7.1 Yêu Cầu Hệ Thống

- Docker Desktop (khuyến nghị) **hoặc** Node.js 18+, MySQL 8.0
- Google Gemini API Key (tùy chọn — có fallback nếu không có)

### 7.2 Cài Đặt Bằng Docker (Khuyến Nghị)

**Bước 1:** Clone dự án và tạo file `.env` ở thư mục gốc:

```env
DB_HOST=...
DB_PORT=...
DB_USER=...
DB_PASS=...
DB_NAME=...
JWT_SECRET=...
GEMINI_API_KEY=...
FRONTEND_URL=...
PORT=5000
```

**Bước 2:** Khởi động backend và database bằng Docker:

```bash
docker-compose up -d
```

**Bước 3:** Chạy frontend:

```bash
cd frontend
npm install
npm start
```

Frontend sẽ chạy tại `http://localhost:3000` (hoặc `3001`).

### 7.3 Cài Đặt Thủ Công (Không Dùng Docker)

**Bước 1:** Tạo database MySQL và chạy file migration:

```bash
mysql -u root -p < migration.sql
```

**Bước 2:** Cài đặt và chạy backend:

```bash
cd backend
npm install
node server.js
```

**Bước 3:** Cài đặt và chạy frontend:

```bash
cd frontend
npm install
npm start
```

---

## 8. Hướng Dẫn Sử Dụng

### 8.1 Hướng Dẫn Dành Cho Học Sinh

**Đăng nhập:**
1. Truy cập địa chỉ web EmotiLoom
2. Nhập username và password → nhấn "Đăng nhập"
3. Hệ thống tự động chuyển đến trang chủ

**Ghi nhật ký cảm xúc:**
1. Chọn "Nhật ký" trên thanh điều hướng bên trái
2. Nhấn nút "Viết nhật ký mới"
3. Chọn mức cảm xúc (1–5 sao) và nhập nội dung
4. Nhấn "Lưu" — AI sẽ tự động phân tích và hiển thị kết quả ngay lập tức

**Xem lịch cảm xúc:**
1. Trên trang Nhật ký, xem phần Calendar ở phía trên
2. Các ngày được tô màu theo mức mood: đỏ (rất tệ) → xanh lá (rất tốt)
3. Nhấn vào một ngày để xem nhật ký của ngày đó
4. Dùng nút `<` `>` để chuyển tháng
5. Xem thống kê tóm tắt bên dưới calendar

**Chat với AI:**
1. Chọn "Chat AI" trên thanh điều hướng
2. Nhập tin nhắn và nhấn gửi
3. AI sẽ phản hồi bằng tiếng Việt, lắng nghe và hỗ trợ tâm lý
4. Nhấn "Xóa lịch sử" để bắt đầu cuộc trò chuyện mới

**Đặt lịch hẹn tham vấn:**
1. Chọn "Tham vấn" trên thanh điều hướng
2. Xem danh sách nhà tham vấn và chọn người phù hợp
3. Chọn ngày, giờ và nhấn "Đặt lịch"
4. Theo dõi trạng thái lịch hẹn (Chờ xác nhận → Đã xác nhận → Hoàn thành)
5. Khi lịch hẹn được xác nhận, nhấn "Chat" để nhắn tin với nhà tham vấn

**Tham gia cộng đồng:**
1. Chọn "Cộng đồng" trên thanh điều hướng
2. Đọc bài đăng từ học sinh và chuyên gia
3. Nhấn "Đăng bài" để chia sẻ cảm xúc hoặc đặt câu hỏi
4. Like và bình luận để tương tác với cộng đồng

### 8.2 Hướng Dẫn Dành Cho Nhà Tham Vấn

**Quản lý lịch hẹn:**
1. Đăng nhập bằng tài khoản nhà tham vấn
2. Chọn "Tham vấn" — xem danh sách ca được gán
3. Nhấn "Xác nhận" để chấp nhận ca, hoặc "Hủy" nếu không thể
4. Nhấn "Chat" để mở kênh nhắn tin với học sinh
5. Sau khi hoàn thành, cập nhật trạng thái thành "Hoàn thành"

**Đăng bài tâm lý:**
1. Vào "Cộng đồng" → nhấn "Đăng bài"
2. Bài đăng của nhà tham vấn tự động được gắn tag "Chuyên gia"

### 8.3 Hướng Dẫn Dành Cho Nhà Trường (Admin)

**Truy cập Dashboard:**
1. Đăng nhập bằng tài khoản admin
2. Hệ thống tự động chuyển đến giao diện Dashboard riêng biệt

**Đọc thống kê:**
- Thẻ tổng quan: số học sinh hoạt động, nhật ký 7 ngày, phiên tham vấn tháng này
- Biểu đồ phân bố mood: xem tỉ lệ học sinh ở từng mức cảm xúc
- Biểu đồ xu hướng: theo dõi cảm xúc trung bình toàn trường theo ngày
- Cảnh báo đỏ: danh sách học sinh có mood thấp liên tục cần chú ý
- Sentiment phổ biến: biết học sinh đang lo lắng hay buồn bã nhiều nhất
- Thống kê tham vấn: số ca theo trạng thái, top nhà tham vấn tích cực

**Lọc theo thời gian:**
- Dùng bộ lọc "7 ngày / 30 ngày / 3 tháng" hoặc chọn khoảng ngày tùy chỉnh

---

## 9. Tính Năng Nổi Bật & Điểm Khác Biệt

| Tính năng | EmotiLoom | Ứng dụng thông thường |
|---|---|---|
| Phân tích cảm xúc AI tức thì | ✅ Gemini NLP | ❌ Không có |
| Calendar cảm xúc trực quan | ✅ Tô màu 5 mức | ❌ Không có |
| Chat tham vấn real-time | ✅ Socket.IO | ❌ Chỉ email/form |
| Dashboard nhà trường | ✅ Thống kê tổng hợp | ❌ Không có |
| Cảnh báo học sinh nguy cơ | ✅ Tự động phát hiện | ❌ Không có |
| Cộng đồng học đường | ✅ Có tag chuyên gia | ❌ Không có |
| Bảo mật nội dung cá nhân | ✅ Admin chỉ thấy tổng hợp | ❌ Thường lộ dữ liệu |

---

## 10. Lưu Ý Kỹ Thuật

- **Gemini API**: Nếu không có API key, hệ thống dùng fallback tự động — prototype vẫn chạy đầy đủ tính năng
- **WebSocket**: Chat tham vấn dùng Socket.IO, cần backend đang chạy để real-time hoạt động
- **Database**: Dùng MySQL 8.0 qua Docker. File `migration.sql` chứa toàn bộ schema cần thiết
- **CORS**: Backend cho phép request từ `FRONTEND_URL` trong `.env`
- **JWT**: Token hết hạn sau 1 ngày, lưu trong `localStorage`
