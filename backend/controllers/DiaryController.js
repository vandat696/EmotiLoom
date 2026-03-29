const db = require('../models/Database');
const { GoogleGenAI } = require('@google/genai');

class DiaryController {
    constructor() {
        // Only initialize Gemini if API key is provided
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        } else {
            this.genAI = null;
            console.warn('⚠️  GEMINI_API_KEY not set - AI sentiment analysis disabled');
        }
    }

    // Tạo nhật ký mới + phân tích AI
    async create(req, res) {
        const { title, content, mood_emoji, mood_score } = req.body;
        const userId = req.user.id;

        if (!content) return res.status(400).json({ error: 'Nội dung không được trống!' });

        try {
            let analysis;

            // Use Gemini AI if available
            if (this.genAI) {
                const prompt = `Phân tích cảm xúc đoạn nhật ký sau: "${content}". 
                Trả về JSON hợp lệ (không có markdown): {"sentiment": "tên cảm xúc tiếng Việt", "score": <số 1-10>, "advice": "lời khuyên ngắn tiếng Việt"}`;

                const result = await this.genAI.models.generateContent({
                    model: 'gemini-3-flash',
                    contents: prompt,
                });

                const rawText = result.text.replace(/```json|```/g, '').trim();
                analysis = JSON.parse(rawText);
            } else {
                // Fallback: basic sentiment based on mood_score
                const sentiments = {
                    1: { sentiment: 'Rất buồn', score: 2, advice: 'Hãy kết nối với bạn bè và người thân' },
                    2: { sentiment: 'Buồn', score: 4, advice: 'Tìm những hoạt động vui vẻ để làm' },
                    3: { sentiment: 'Bình thường', score: 5, advice: 'Tiếp tục duy trì thói quen lành mạnh' },
                    4: { sentiment: 'Vui', score: 7, advice: 'Chia sẻ niềm vui của bạn với người khác' },
                    5: { sentiment: 'Rất vui', score: 9, advice: 'Tận hưởng khoảnh khắc này và ghi lại nó' }
                };
                analysis = sentiments[mood_score] || { sentiment: 'Trung lập', score: 5, advice: 'Chăm sóc bản thân tốt hơn' };
                console.log('💾 Using fallback sentiment (no Gemini API)');
            }

            // Tạo title mặc định nếu không có
            const finalTitle = title || content.substring(0, 100);

            // Thử insert với title, nếu fail thì insert mà không có title
            let sql = `INSERT INTO diaries (user_id, title, content, mood_emoji, mood_score, sentiment, ai_score, ai_advice) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            let params = [
                userId, finalTitle, content, mood_emoji || null, mood_score || null,
                analysis.sentiment, analysis.score, analysis.advice
            ];
            
            try {
                const [rows] = await db.query(sql, params);
                res.json({ success: true, diary_id: rows.insertId, analysis });
            } catch (titleError) {
                // Nếu cột title không tồn tại, insert mà không có title
                if (titleError.message.includes('Unknown column') && titleError.message.includes('title')) {
                    console.log('⚠️  Column title not found, inserting without title');
                    sql = `INSERT INTO diaries (user_id, content, mood_emoji, mood_score, sentiment, ai_score, ai_advice) 
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    params = [
                        userId, content, mood_emoji || null, mood_score || null,
                        analysis.sentiment, analysis.score, analysis.advice
                    ];
                    const [rows] = await db.query(sql, params);
                    res.json({ success: true, diary_id: rows.insertId, analysis });
                } else {
                    throw titleError;
                }
            }
        } catch (error) {
            console.error('DiaryController.create error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Lấy danh sách nhật ký của user
    async getAll(req, res) {
        const userId = req.user.id;
        try {
            const [rows] = await db.query(
                'SELECT * FROM diaries WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            res.json({ success: true, diaries: rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Xoá nhật ký
    async delete(req, res) {
        const { id } = req.params;
        const userId = req.user.id;
        try {
            await db.query('DELETE FROM diaries WHERE id = ? AND user_id = ?', [id, userId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Lấy dữ liệu calendar cho tháng
    async getCalendarData(req, res) {
        const userId = req.user.id;
        const { year, month } = req.query;
        
        // Mặc định lấy tháng hiện tại
        const now = new Date();
        const y = year ? parseInt(year) : now.getFullYear();
        const m = month ? parseInt(month) : now.getMonth() + 1;

        try {
            // Lấy tất cả nhật ký trong tháng
            const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
            const endDate = new Date(y, m, 0);
            const endDateStr = `${y}-${String(m).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

            const sql = `
                SELECT DATE(created_at) as date, mood_score, created_at
                FROM diaries
                WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ?
                ORDER BY created_at DESC
            `;
            const [rows] = await db.query(sql, [userId, startDate, endDateStr]);

            // Lấy mood_score của nhật ký MỚI NHẤT trong mỗi ngày
            const result = {};
            rows.forEach(row => {
                const dateStr = row.date || new Date(row.created_at).toISOString().split('T')[0];
                // Chỉ lưu nếu chưa có (vì dữ liệu đã sort DESC, nên cái đầu tiên là mới nhất)
                if (!result[dateStr] && row.mood_score) {
                    result[dateStr] = row.mood_score;
                }
            });

            res.json({ success: true, year: y, month: m, calendarData: result });
        } catch (error) {
            console.error('DiaryController.getCalendarData error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Lấy thống kê mood của tháng
    async getStatistics(req, res) {
        const userId = req.user.id;
        const { year, month } = req.query;

        const now = new Date();
        const y = year ? parseInt(year) : now.getFullYear();
        const m = month ? parseInt(month) : now.getMonth() + 1;

        try {
            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 0, 23, 59, 59);

            // Lấy tất cả nhật ký trong tháng
            const sql = `
                SELECT mood_score
                FROM diaries
                WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ?
            `;
            const [rows] = await db.query(sql, [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

            // Đếm số ngày theo từng mức mood
            const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            const uniqueDates = new Set();
            let totalScore = 0;

            rows.forEach(row => {
                const date = new Date(row.created_at).toISOString().split('T')[0];
                uniqueDates.add(date);
                totalScore += row.mood_score || 0;
                if (row.mood_score && row.mood_score >= 1 && row.mood_score <= 5) {
                    moodCounts[row.mood_score]++;
                }
            });

            const totalDays = uniqueDates.size;
            const averageMood = totalDays > 0 ? (totalScore / rows.length).toFixed(2) : 0;

            res.json({
                success: true,
                year: y,
                month: m,
                statistics: {
                    totalDiaries: rows.length,
                    totalDays: totalDays,
                    averageMood: parseFloat(averageMood),
                    moodDistribution: moodCounts
                }
            });
        } catch (error) {
            console.error('DiaryController.getStatistics error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new DiaryController();