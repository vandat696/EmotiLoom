# Tài Liệu Yêu Cầu (Prototype)

## Giới Thiệu

EmotiLoom là một nền tảng web hỗ trợ sức khỏe tinh thần học đường tích hợp AI. Prototype tập trung vào các tính năng cốt lõi: ghi nhật ký cảm xúc với phân tích AI tức thì, trò chuyện với AI hỗ trợ tâm lý, đặt lịch hẹn tham vấn, chat tham vấn bảo mật, và cộng đồng chia sẻ.

Prototype bỏ qua xác thực người dùng, phân quyền phức tạp và bảo mật production. Người dùng được giả định sẵn có trong hệ thống với `user_id` cố định để demo.

Codebase hiện tại: backend Node.js/Express, frontend React, database PostgreSQL, tích hợp Google Gemini AI.

---

## Bảng Thuật Ngữ

- **System**: Nền tảng web EmotiLoom
- **Học_Sinh**: Người dùng vai trò `student`
- **Nha_Tham_Van**: Người dùng vai trò `counselor`
- **AI_Engine**: Module phân tích cảm xúc tích hợp Google Gemini
- **Nhat_Ky**: Bản ghi cảm xúc cá nhân, gồm tiêu đề, nội dung, mood score và kết quả AI
- **Lich_Hen**: Phiên tham vấn giữa học sinh và nhà tham vấn, trạng thái: `pending`, `confirmed`, `completed`, `cancelled`
- **Session_Chat**: Kênh nhắn tin gắn với một Lich_Hen cụ thể
- **Bai_Dang**: Nội dung đăng lên cộng đồng, tag: `chia-se`, `hoi-dap`, `chuyen-gia`
- **Mood_Score**: Điểm tâm trạng từ 1 đến 5 do học sinh chọn
- **Sentiment**: Nhãn cảm xúc tiếng Việt do AI_Engine trả về

---

## Yêu Cầu

### Yêu Cầu 1: Nhật Ký Cảm Xúc

**User Story:** Là một học sinh, tôi muốn ghi lại cảm xúc hàng ngày vào nhật ký, để theo dõi trạng thái tâm lý của bản thân theo thời gian.

#### Tiêu Chí Chấp Nhận

1. WHEN Học_Sinh gửi yêu cầu tạo nhật ký với `content` không rỗng, THE System SHALL lưu bản ghi Nhat_Ky với `user_id`, `title`, `content`, `mood_emoji`, `mood_score` và kết quả phân tích AI.
2. IF `content` bị rỗng, THEN THE System SHALL trả về lỗi HTTP 400 với thông báo "Nội dung không được trống!".
3. THE System SHALL trả về danh sách tất cả Nhat_Ky của Học_Sinh, sắp xếp theo `created_at` giảm dần.
4. WHEN Học_Sinh gửi yêu cầu xóa một Nhat_Ky, THE System SHALL xóa bản ghi tương ứng.
5. THE System SHALL cho phép Học_Sinh chọn Mood_Score từ 1 đến 5 khi tạo nhật ký.

---

### Yêu Cầu 2: Phân Tích Cảm Xúc Bằng AI

**User Story:** Là một học sinh, tôi muốn nhận phân tích cảm xúc tự động từ AI ngay sau khi ghi nhật ký, để hiểu rõ hơn về trạng thái tâm lý và nhận lời khuyên phù hợp.

#### Tiêu Chí Chấp Nhận

1. WHEN Học_Sinh tạo một Nhat_Ky mới, THE AI_Engine SHALL phân tích `content` và trả về `sentiment` (nhãn cảm xúc tiếng Việt), `score` (điểm từ 1-10) và `advice` (lời khuyên ngắn tiếng Việt).
2. THE AI_Engine SHALL trả về kết quả dưới dạng JSON hợp lệ với đúng ba trường: `sentiment`, `score`, `advice`.
3. WHEN AI_Engine không thể phân tích, THE System SHALL trả về lỗi HTTP 500 và ghi log lỗi.
4. THE System SHALL lưu kết quả phân tích AI (`sentiment`, `ai_score`, `ai_advice`) vào bản ghi Nhat_Ky.
5. THE System SHALL hiển thị `sentiment` và `ai_advice` trên thẻ nhật ký sau khi tạo thành công.

---

### Yêu Cầu 3: Trò Chuyện Với AI

**User Story:** Là một học sinh, tôi muốn trò chuyện trực tiếp với trợ lý AI, để chia sẻ cảm xúc và nhận hỗ trợ tâm lý tức thì.

#### Tiêu Chí Chấp Nhận

1. WHEN Học_Sinh gửi một tin nhắn không rỗng, THE AI_Engine SHALL trả về phản hồi bằng tiếng Việt trong ngữ cảnh hỗ trợ sức khỏe tâm thần học đường.
2. THE AI_Engine SHALL sử dụng tối đa 10 tin nhắn gần nhất trong lịch sử để tạo ngữ cảnh cho phản hồi.
3. THE System SHALL lưu cả tin nhắn của Học_Sinh (role `user`) và phản hồi của AI (role `assistant`) vào bảng `ai_chats`.
4. IF `message` bị rỗng, THEN THE System SHALL trả về lỗi HTTP 400 với thông báo "Tin nhắn không được trống!".
5. THE System SHALL cho phép Học_Sinh xem toàn bộ lịch sử trò chuyện AI, sắp xếp theo `created_at` tăng dần.
6. THE System SHALL cho phép Học_Sinh xóa toàn bộ lịch sử trò chuyện AI.
7. THE AI_Engine SHALL không đưa ra chẩn đoán y tế và SHALL khuyến khích Học_Sinh gặp Nha_Tham_Van khi cần.

---

### Yêu Cầu 4: Đặt Lịch Hẹn Tham Vấn

**User Story:** Là một học sinh, tôi muốn đặt lịch hẹn với nhà tham vấn, để nhận được sự hỗ trợ chuyên nghiệp khi cần.

#### Tiêu Chí Chấp Nhận

1. WHEN Học_Sinh gửi yêu cầu đặt lịch với `counselor_id`, `appointment_date`, `appointment_time` hợp lệ, THE System SHALL tạo bản ghi Lich_Hen với trạng thái mặc định `pending`.
2. THE System SHALL cho phép Học_Sinh xem danh sách tất cả Lich_Hen của mình, sắp xếp theo `appointment_date` và `appointment_time` giảm dần.
3. THE System SHALL cho phép Nha_Tham_Van xem danh sách tất cả Lich_Hen được gán cho mình.
4. WHEN Nha_Tham_Van cập nhật trạng thái Lich_Hen, THE System SHALL lưu trạng thái mới vào cơ sở dữ liệu.
5. THE System SHALL hỗ trợ bốn trạng thái Lich_Hen: `pending`, `confirmed`, `completed`, `cancelled`.
6. THE System SHALL cho phép Học_Sinh xem danh sách tất cả Nha_Tham_Van với thông tin `full_name`, `specialty`, `experience_years`, `bio` và `is_available`.

---

### Yêu Cầu 5: Phiên Chat Tham Vấn

**User Story:** Là một học sinh hoặc nhà tham vấn, tôi muốn nhắn tin trong kênh chat riêng của từng lịch hẹn, để trao đổi thông tin có tổ chức.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng gửi tin nhắn trong một Lich_Hen, THE System SHALL lưu tin nhắn với `appointment_id`, `sender_id`, `content` và `created_at`.
2. THE System SHALL trả về danh sách tin nhắn của một Lich_Hen theo thứ tự `created_at` tăng dần, kèm `sender_name` và `sender_role`.

---

### Yêu Cầu 6: Cộng Đồng Chia Sẻ

**User Story:** Là một người dùng, tôi muốn đăng bài, bình luận và tương tác trong cộng đồng, để chia sẻ kinh nghiệm và nhận hỗ trợ từ cộng đồng học đường.

#### Tiêu Chí Chấp Nhận

1. THE System SHALL cho phép xem danh sách tối đa 50 Bai_Dang gần nhất, sắp xếp theo `created_at` giảm dần, kèm `like_count` và `comment_count`.
2. WHEN Học_Sinh tạo Bai_Dang, THE System SHALL gán tag từ giá trị `tag` trong request (mặc định `chia-se`).
3. WHEN Nha_Tham_Van tạo Bai_Dang, THE System SHALL luôn gán tag `chuyen-gia`.
4. IF `content` của Bai_Dang bị rỗng, THEN THE System SHALL trả về lỗi HTTP 400 với thông báo "Nội dung không được trống!".
5. THE System SHALL cho phép người dùng xóa Bai_Dang của chính mình.
6. THE System SHALL cho phép xem bình luận của một Bai_Dang, sắp xếp theo `created_at` tăng dần, kèm `username` và `role` của người bình luận.
7. WHEN người dùng thêm bình luận với `content` không rỗng, THE System SHALL lưu bình luận với `post_id`, `user_id` và `content`.
8. WHEN người dùng toggle like cho một Bai_Dang, THE System SHALL thêm like nếu chưa like, hoặc xóa like nếu đã like, và trả về trạng thái `liked` tương ứng.

---

### Yêu Cầu 7: Calendar Cảm Xúc Và Thống Kê

**User Story:** Là một học sinh, tôi muốn xem lịch cảm xúc theo tháng và thống kê tổng hợp, để nhìn lại hành trình tâm lý của mình theo thời gian.

#### Tiêu Chí Chấp Nhận

1. THE System SHALL hiển thị một calendar theo tháng trên trang Nhật Ký, trong đó mỗi ngày có ít nhất một Nhat_Ky SHALL được tô màu tương ứng với Mood_Score của ngày đó.
2. THE System SHALL sử dụng 5 màu phân biệt tương ứng với 5 mức Mood_Score: mức 1 (rất tệ), mức 2 (tệ), mức 3 (bình thường), mức 4 (tốt), mức 5 (rất tốt).
3. WHEN một ngày có nhiều hơn một Nhat_Ky, THE System SHALL tô màu ngày đó theo Mood_Score trung bình làm tròn của các bản ghi trong ngày.
4. WHEN Học_Sinh nhấn vào một ngày trên calendar, THE System SHALL hiển thị danh sách các Nhat_Ky của ngày đó.
5. THE System SHALL cho phép Học_Sinh điều hướng sang tháng trước và tháng sau trên calendar.
6. THE System SHALL hiển thị phần thống kê tóm tắt gồm: số ngày theo từng mức Mood_Score (1–5) trong tháng hiện tại.
7. THE System SHALL hiển thị tổng số ngày đã ghi nhật ký trong tháng hiện tại.
8. WHEN không có Nhat_Ky nào trong tháng, THE System SHALL hiển thị calendar trống và thống kê toàn bộ bằng 0.

---

### Yêu Cầu 8: Giao Diện Người Dùng

**User Story:** Là một học sinh, tôi muốn sử dụng giao diện web thân thiện và dễ điều hướng, để thoải mái chia sẻ cảm xúc và truy cập các tính năng mọi lúc.

#### Tiêu Chí Chấp Nhận

1. THE System SHALL hiển thị Sidebar điều hướng với các mục: Trang Chủ, Nhật Ký, Trò Chuyện AI, Lịch Hẹn, Cộng Đồng.
2. THE System SHALL hiển thị kết quả phân tích AI (`sentiment`, `ai_advice`) trực tiếp trên thẻ nhật ký sau khi tạo thành công.
3. THE System SHALL hiển thị màu sắc viền thẻ nhật ký tương ứng với Mood_Score của bản ghi.
4. WHEN người dùng đang chờ phản hồi từ AI hoặc server, THE System SHALL hiển thị trạng thái loading và vô hiệu hóa nút gửi để tránh gửi trùng lặp.

---

### Yêu Cầu 9: Dashboard Nhà Trường (Admin)

**User Story:** Là đại diện nhà trường, tôi muốn đăng nhập vào một giao diện riêng biệt và xem các thống kê tổng quan về sức khỏe tinh thần của học sinh toàn trường, để phát hiện sớm các dấu hiệu bất ổn và đưa ra can thiệp kịp thời.

#### Tiêu Chí Chấp Nhận

1. THE System SHALL cung cấp một tài khoản Admin được tạo sẵn trong hệ thống với role `admin`, dùng để đăng nhập vào giao diện nhà trường.
2. WHEN Admin đăng nhập, THE System SHALL chuyển hướng đến giao diện Dashboard riêng biệt, khác hoàn toàn về layout so với giao diện học sinh và nhà tham vấn.
3. THE System SHALL hiển thị tổng quan toàn trường gồm: tổng số học sinh đang hoạt động, tổng số nhật ký được ghi trong 7 ngày gần nhất, tổng số phiên tham vấn trong tháng hiện tại.
4. THE System SHALL hiển thị biểu đồ phân bố Mood_Score toàn trường theo từng mức (1–5) trong khoảng thời gian có thể lọc: 7 ngày, 30 ngày, 3 tháng.
5. THE System SHALL hiển thị xu hướng cảm xúc trung bình toàn trường theo ngày dưới dạng biểu đồ đường (line chart) trong 30 ngày gần nhất.
6. THE System SHALL hiển thị danh sách các học sinh có Mood_Score trung bình thấp (≤ 2) trong 7 ngày gần nhất như một cảnh báo cần chú ý, kèm tên học sinh và điểm trung bình.
7. THE System SHALL hiển thị thống kê các nhãn Sentiment phổ biến nhất toàn trường trong tháng hiện tại (ví dụ: "lo lắng" chiếm 35%, "buồn bã" chiếm 20%).
8. THE System SHALL hiển thị thống kê hoạt động tham vấn: số ca `pending`, `confirmed`, `completed`, `cancelled` trong tháng hiện tại.
9. THE System SHALL hiển thị top 5 nhà tham vấn có nhiều ca `completed` nhất trong tháng.
10. THE System SHALL cho phép Admin lọc tất cả thống kê theo khoảng thời gian tùy chọn (từ ngày — đến ngày).
11. THE System SHALL không hiển thị nội dung chi tiết nhật ký cá nhân của học sinh trong Dashboard, chỉ hiển thị dữ liệu tổng hợp và ẩn danh để bảo vệ quyền riêng tư.
