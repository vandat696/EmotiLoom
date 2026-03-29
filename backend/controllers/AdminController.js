const db = require('../models/Database');

class AdminController {
    
    // 📊 Get dashboard overview stats
    async getDashboardOverview(req, res) {
        const { fromDate, toDate } = req.query;
        
        try {
            // Tổng số học sinh đang hoạt động
            const [studentCount] = await db.query(`
                SELECT COUNT(*) as total FROM users WHERE role = 'student'
            `);
            
            // Tổng số nhật ký trong 7 ngày gần nhất
            const [diaryCount] = await db.query(`
                SELECT COUNT(*) as total FROM diaries 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            `);
            
            // Tổng số phiên tham vấn hoàn tất trong tháng hiện tại
            const [appointmentCount] = await db.query(`
                SELECT COUNT(*) as total FROM appointments 
                WHERE status = 'completed'
                AND MONTH(appointment_date) = MONTH(NOW())
                AND YEAR(appointment_date) = YEAR(NOW())
            `);
            
            res.json({
                success: true,
                overview: {
                    activeStudents: studentCount[0].total,
                    diariesLast7Days: diaryCount[0].total,
                    appointmentsThisMonth: appointmentCount[0].total
                }
            });
        } catch (error) {
            console.error('Error getting dashboard overview:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // 📈 Get mood distribution stats (1-5 levels)
    async getMoodDistribution(req, res) {
        const { days = 30 } = req.query; // 7, 30, 90
        
        try {
            const [results] = await db.query(`
                SELECT mood_score, COUNT(*) as count
                FROM diaries
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY mood_score
                ORDER BY mood_score ASC
            `, [days]);
            
            // Map to 1-5 levels with 0 count for missing levels
            const distribution = {};
            for (let i = 1; i <= 5; i++) {
                const found = results.find(r => r.mood_score === i);
                distribution[i] = found ? found.count : 0;
            }
            
            res.json({ success: true, distribution });
        } catch (error) {
            console.error('Error getting mood distribution:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // 📊 Get mood trending (last 30 days - daily average)
    async getMoodTrending(req, res) {
        try {
            const [results] = await db.query(`
                SELECT DATE(created_at) as date, AVG(mood_score) as avg_mood, COUNT(*) as count
                FROM diaries
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `);
            
            res.json({ success: true, trending: results });
        } catch (error) {
            console.error('Error getting mood trending:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // ⚠️ Get students with low average mood (≤ 2) in last 7 days
    async getLowMoodStudents(req, res) {
        try {
            const [results] = await db.query(`
                SELECT u.id, u.username, AVG(d.mood_score) as avg_mood, COUNT(*) as diary_count
                FROM users u
                LEFT JOIN diaries d ON u.id = d.user_id
                    AND d.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                WHERE u.role = 'student'
                GROUP BY u.id, u.username
                HAVING AVG(d.mood_score) <= 2 OR (COUNT(*) = 0 AND u.id NOT IN (
                    SELECT DISTINCT user_id FROM diaries WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ))
                ORDER BY avg_mood ASC
                LIMIT 20
            `);
            
            res.json({ success: true, students: results });
        } catch (error) {
            console.error('Error getting low mood students:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // 🏷️ Get top sentiments this month
    async getTopSentiments(req, res) {
        try {
            const [results] = await db.query(`
                SELECT sentiment, COUNT(*) as count
                FROM diaries
                WHERE sentiment IS NOT NULL
                AND sentiment != ''
                AND MONTH(created_at) = MONTH(NOW())
                AND YEAR(created_at) = YEAR(NOW())
                GROUP BY sentiment
                ORDER BY count DESC
                LIMIT 10
            `);
            
            const total = results.reduce((sum, r) => sum + r.count, 0);
            
            // Nếu không có dữ liệu
            if (total === 0) {
                return res.json({ success: true, sentiments: [] });
            }
            
            const sentiments = results.map(r => ({
                sentiment: r.sentiment,
                count: r.count,
                percentage: ((r.count / total) * 100).toFixed(1)
            }));
            
            res.json({ success: true, sentiments });
        } catch (error) {
            console.error('Error getting top sentiments:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // 💬 Get appointment stats (by status)
    async getAppointmentStats(req, res) {
        try {
            const [results] = await db.query(`
                SELECT status, COUNT(*) as count
                FROM appointments
                WHERE MONTH(appointment_date) = MONTH(NOW())
                AND YEAR(appointment_date) = YEAR(NOW())
                GROUP BY status
            `);
            
            const stats = {
                pending: 0,
                confirmed: 0,
                completed: 0,
                cancelled: 0
            };
            
            results.forEach(r => {
                if (stats.hasOwnProperty(r.status)) {
                    stats[r.status] = r.count;
                }
            });
            
            res.json({ success: true, stats });
        } catch (error) {
            console.error('Error getting appointment stats:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // ⭐ Get top 5 counselors by completed appointments
    async getTopCounselors(req, res) {
        try {
            const [results] = await db.query(`
                SELECT 
                    u.id, u.username,
                    COALESCE(cp.full_name, u.username) as full_name,
                    cp.specialty,
                    COUNT(a.id) as completed_count
                FROM users u
                LEFT JOIN counselor_profiles cp ON u.id = cp.user_id
                LEFT JOIN appointments a ON u.id = a.counselor_id 
                    AND a.status = 'completed'
                    AND MONTH(a.appointment_date) = MONTH(NOW())
                    AND YEAR(a.appointment_date) = YEAR(NOW())
                WHERE u.role = 'counselor'
                GROUP BY u.id, u.username, cp.full_name, cp.specialty
                ORDER BY completed_count DESC
                LIMIT 5
            `);
            
            res.json({ success: true, counselors: results });
        } catch (error) {
            console.error('Error getting top counselors:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // 📅 Get stats filtered by date range
    async getStatsByDateRange(req, res) {
        const { fromDate, toDate } = req.query;
        
        if (!fromDate || !toDate) {
            return res.status(400).json({ error: 'fromDate and toDate are required' });
        }
        
        try {
            // Mood distribution
            const [moodDist] = await db.query(`
                SELECT mood_score, COUNT(*) as count
                FROM diaries
                WHERE created_at >= ? AND created_at <= ?
                GROUP BY mood_score
                ORDER BY mood_score ASC
            `, [fromDate, toDate]);
            
            // Daily trending
            const [trending] = await db.query(`
                SELECT DATE(created_at) as date, AVG(mood_score) as avg_mood, COUNT(*) as count
                FROM diaries
                WHERE created_at >= ? AND created_at <= ?
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `, [fromDate, toDate]);
            
            // Top sentiments
            const [sentiments] = await db.query(`
                SELECT sentiment, COUNT(*) as count
                FROM diaries
                WHERE sentiment IS NOT NULL
                AND sentiment != ''
                AND created_at >= ? AND created_at <= ?
                GROUP BY sentiment
                ORDER BY count DESC
                LIMIT 10
            `, [fromDate, toDate]);
            
            const moodDistribution = {};
            for (let i = 1; i <= 5; i++) {
                const found = moodDist.find(r => r.mood_score === i);
                moodDistribution[i] = found ? found.count : 0;
            }
            
            const total = sentiments.reduce((sum, s) => sum + s.count, 0);
            const topSentiments = total > 0 ? sentiments.map(s => ({
                sentiment: s.sentiment,
                count: s.count,
                percentage: ((s.count / total) * 100).toFixed(1)
            })) : [];
            
            res.json({
                success: true,
                dateRange: { fromDate, toDate },
                moodDistribution,
                trending,
                sentiments: topSentiments
            });
        } catch (error) {
            console.error('Error getting stats by date range:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AdminController();
