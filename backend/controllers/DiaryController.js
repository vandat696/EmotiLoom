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
                    model: 'gemini-2.5-flash-lite',
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

            const sql = `INSERT INTO diaries (user_id, title, content, mood_emoji, mood_score, sentiment, ai_score, ai_advice) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const [rows] = await db.query(sql, [
                userId, title || null, content, mood_emoji || null, mood_score || null,
                analysis.sentiment, analysis.score, analysis.advice
            ]);

            res.json({ success: true, diary_id: rows.insertId, analysis });
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
}

module.exports = new DiaryController();