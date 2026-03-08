const db = require('../models/Database');
const { GoogleGenAI } = require('@google/genai');

class DiaryController {
    constructor() {
        this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    // Tạo nhật ký mới + phân tích AI
    async create(req, res) {
        const { content, mood_emoji, mood_score } = req.body;
        const userId = req.user.id;

        if (!content) return res.status(400).json({ error: 'Nội dung không được trống!' });

        try {
            const prompt = `Phân tích cảm xúc đoạn nhật ký sau: "${content}". 
            Trả về JSON hợp lệ (không có markdown): {"sentiment": "tên cảm xúc tiếng Việt", "score": <số 1-10>, "advice": "lời khuyên ngắn tiếng Việt"}`;

            const result = await this.genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const rawText = result.text.replace(/```json|```/g, '').trim();
            const analysis = JSON.parse(rawText);

            const sql = `INSERT INTO diaries (user_id, content, mood_emoji, mood_score, sentiment, ai_score, ai_advice) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const [rows] = await db.query(sql, [
                userId, content, mood_emoji || null, mood_score || null,
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