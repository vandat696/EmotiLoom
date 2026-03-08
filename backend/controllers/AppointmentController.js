const db = require('../models/Database');

class AppointmentController {

    // ── COUNSELOR PROFILE ──────────────────────────────────────────────────────

    // Lấy danh sách tất cả nhà tham vấn
    async getCounselors(req, res) {
        try {
            const [rows] = await db.query(`
                SELECT u.id, u.username, 
                       COALESCE(cp.full_name, u.username) as full_name,
                       cp.specialty, cp.experience_years, cp.bio,
                       COALESCE(cp.is_available, 1) as is_available
                FROM users u
                LEFT JOIN counselor_profiles cp ON u.id = cp.user_id
                WHERE u.role = 'counselor'
            `);
            res.json({ success: true, counselors: rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Nhà tham vấn cập nhật hồ sơ
    async updateProfile(req, res) {
        const { full_name, specialty, experience_years, bio, is_available } = req.body;
        const userId = req.user.id;
        if (req.user.role !== 'counselor') return res.status(403).json({ error: 'Không có quyền!' });

        try {
            const [existing] = await db.query('SELECT id FROM counselor_profiles WHERE user_id = ?', [userId]);
            if (existing.length > 0) {
                await db.query(
                    `UPDATE counselor_profiles SET full_name=?, specialty=?, experience_years=?, bio=?, is_available=? WHERE user_id=?`,
                    [full_name, specialty, experience_years, bio, is_available, userId]
                );
            } else {
                await db.query(
                    `INSERT INTO counselor_profiles (user_id, full_name, specialty, experience_years, bio, is_available) VALUES (?,?,?,?,?,?)`,
                    [userId, full_name, specialty, experience_years, bio, is_available ?? true]
                );
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // ── APPOINTMENTS ───────────────────────────────────────────────────────────

    // Học sinh đặt lịch hẹn
    async book(req, res) {
        const { counselor_id, appointment_date, appointment_time, note } = req.body;
        const studentId = req.user.id;
        if (req.user.role !== 'student') return res.status(403).json({ error: 'Chỉ học sinh mới đặt được lịch!' });

        try {
            const [rows] = await db.query(
                `INSERT INTO appointments (student_id, counselor_id, appointment_date, appointment_time, note) VALUES (?,?,?,?,?)`,
                [studentId, counselor_id, appointment_date, appointment_time, note || null]
            );
            res.json({ success: true, appointment_id: rows.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Lấy danh sách lịch hẹn (học sinh xem của mình, tham vấn xem của mình)
    async getMyAppointments(req, res) {
        const userId = req.user.id;
        const role = req.user.role;
        try {
            let rows;
            if (role === 'student') {
                [rows] = await db.query(`
                    SELECT a.*, cp.full_name as counselor_name, cp.specialty
                    FROM appointments a
                    JOIN counselor_profiles cp ON a.counselor_id = cp.user_id
                    WHERE a.student_id = ?
                    ORDER BY a.appointment_date DESC, a.appointment_time DESC
                `, [userId]);
            } else {
                [rows] = await db.query(`
                    SELECT a.*, u.username as student_username
                    FROM appointments a
                    JOIN users u ON a.student_id = u.id
                    WHERE a.counselor_id = ?
                    ORDER BY a.appointment_date DESC, a.appointment_time DESC
                `, [userId]);
            }
            res.json({ success: true, appointments: rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Nhà tham vấn cập nhật trạng thái lịch hẹn
    async updateStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        if (req.user.role !== 'counselor') return res.status(403).json({ error: 'Không có quyền!' });

        try {
            await db.query(
                'UPDATE appointments SET status = ? WHERE id = ? AND counselor_id = ?',
                [status, id, userId]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // ── MESSAGES ───────────────────────────────────────────────────────────────

    // Gửi tin nhắn trong lịch hẹn
    async sendMessage(req, res) {
        const { appointment_id, content } = req.body;
        const senderId = req.user.id;

        try {
            // Kiểm tra user có quyền nhắn tin trong lịch hẹn này không
            const [appt] = await db.query(
                'SELECT * FROM appointments WHERE id = ? AND (student_id = ? OR counselor_id = ?)',
                [appointment_id, senderId, senderId]
            );
            if (appt.length === 0) return res.status(403).json({ error: 'Không có quyền!' });

            const [rows] = await db.query(
                'INSERT INTO messages (appointment_id, sender_id, content) VALUES (?,?,?)',
                [appointment_id, senderId, content]
            );
            res.json({ success: true, message_id: rows.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Lấy tin nhắn của 1 lịch hẹn
    async getMessages(req, res) {
        const { appointment_id } = req.params;
        const userId = req.user.id;

        try {
            const [appt] = await db.query(
                'SELECT * FROM appointments WHERE id = ? AND (student_id = ? OR counselor_id = ?)',
                [appointment_id, userId, userId]
            );
            if (appt.length === 0) return res.status(403).json({ error: 'Không có quyền!' });

            const [rows] = await db.query(`
                SELECT m.*, u.username as sender_name, u.role as sender_role
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.appointment_id = ?
                ORDER BY m.created_at ASC
            `, [appointment_id]);

            res.json({ success: true, messages: rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AppointmentController();