-- ============================================================================
-- SEED TEST DATA cho EmotiLoom
-- ============================================================================
-- User đề ngành chứa không? kiểm tra xem có test user không, nếu không thì 
-- Comment các INSERT user và dùng ID của user hiện tại

-- ============================================================================
-- 1. TEST COUNSELORS (nếu chưa có)
-- ============================================================================
-- Nếu counselor chưa tồn tại, thêm test counselor
INSERT INTO users (username, password, role, created_at) 
SELECT 'counselor_test', 'test123', 'counselor', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'counselor_test');

-- ============================================================================
-- 2. TEST APPOINTMENTS & MESSAGES
-- ============================================================================
-- Giả sử:
-- - Student ID = 1 (hoặc ID của user mới)
-- - Counselor ID = 3 (hoặc counselor_test)
-- Bạn cần thay thế ID này với ID thực tế

-- Tạo appointment xác nhận cho student 1 với counselor 3
INSERT INTO appointments (student_id, counselor_id, appointment_date, appointment_time, status, note, created_at)
SELECT 1, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'confirmed', 'Test appointment', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM appointments 
    WHERE student_id = 1 AND counselor_id = 3 AND status = 'confirmed'
    LIMIT 1
);

-- Lấy appointment ID vừa tạo
SET @appointment_id = LAST_INSERT_ID();

-- Nếu không phải vừa insert, tìm cái cũ
SELECT @appointment_id := id FROM appointments 
WHERE student_id = 1 AND counselor_id = 3 AND status = 'confirmed' 
LIMIT 1;

-- Thêm messages cho appointment
INSERT INTO messages (appointment_id, sender_id, content, created_at) VALUES
(@appointment_id, 1, '👋 Xin chào! Tôi muốn tìm hiểu thêm về cách xử lý stress', NOW()),
(@appointment_id, 3, '✨ Xin chào! Mình sẽ giúp bạn tìm ra những cách hiệu quả. Nguyên nhân stress chính của bạn là gì?', DATE_ADD(NOW(), INTERVAL 2 MINUTE)),
(@appointment_id, 1, '😔 Chủ yếu từ công việc và áp lực từ gia đình', DATE_ADD(NOW(), INTERVAL 4 MINUTE)),
(@appointment_id, 3, '💭 Cảm thấy hiểu rồi. Hãy cùng mình thực hành kỹ thuật thở sâu. Bạn thử làm theo...', DATE_ADD(NOW(), INTERVAL 6 MINUTE));

-- Kiểm tra dữ liệu đã thêm
SELECT 'Test data seeded successfully!' as status;
SELECT COUNT(*) as appointment_count FROM appointments;
SELECT COUNT(*) as message_count FROM messages;
