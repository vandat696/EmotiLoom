-- Create admin account for EmotiLoom Dashboard
-- Username: admin
-- Password: admin123
-- Run this script in your MySQL database

INSERT INTO users (username, password, role) 
VALUES ('admin', '$2b$10$R5BjLQYrfeeDo/gyGoDFqe.C1rb7qOUwOft4eK0D7riirS5TEgIk2', 'admin')
ON DUPLICATE KEY UPDATE role = 'admin';

-- Verify admin user was created
SELECT id, username, role, created_at FROM users WHERE role = 'admin';
