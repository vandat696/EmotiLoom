-- ============================================================
-- Migration: Thêm cột 'title' vào bảng 'diaries'
-- Chạy script này trên Aiven để khắc phục lỗi
-- ============================================================

-- Kiểm tra và thêm cột title nếu chưa tồn tại
ALTER TABLE diaries 
ADD COLUMN title VARCHAR(255) DEFAULT NULL AFTER id;

-- Kiểm tra cấu trúc bảng sau khi migrate
DESCRIBE diaries;

-- ============================================================
-- Nếu có lỗi "Duplicate column name", không sao cả
-- Có nghĩa là cột title đã tồn tại
-- ============================================================
