const db = require('../models/Database');
const { GoogleGenAI } = require('@google/genai');

class AIChatController {
    constructor() {
        this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    // Gửi tin nhắn và nhận phản hồi từ AI
    async chat(req, res) {
        const { message } = req.body;
        const userId = req.user.id;

        if (!message) return res.status(400).json({ error: 'Tin nhắn không được trống!' });

        try {
            // Lấy lịch sử chat gần đây (10 tin nhắn)
            const [history] = await db.query(
                `SELECT role, content FROM ai_chats WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
                [userId]
            );
            const historyReversed = history.reverse();

            // Tạo context từ lịch sử
            const historyText = historyReversed.map(h =>
                `${h.role === 'user' ? 'Người dùng' : 'AI'}: ${h.content}`
            ).join('\n');

            const systemPrompt = `Bạn là trợ lý tâm lý ảo của EmotiLoom, một ứng dụng hỗ trợ sức khỏe tâm thần cho học sinh. 
Hãy lắng nghe, đồng cảm và hỗ trợ người dùng một cách nhẹ nhàng, ấm áp. 
Không đưa ra chẩn đoán y tế. Khuyến khích gặp nhà tham vấn nếu cần thiết.
Trả lời bằng tiếng Việt, ngắn gọn và thân thiện.

Lịch sử trò chuyện:
${historyText}

Người dùng: ${message}
AI:`;

            const result = await this.genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemPrompt,
            });

            const aiReply = result.text.trim();

            // Lưu cả 2 tin nhắn vào database
            await db.query(
                'INSERT INTO ai_chats (user_id, role, content) VALUES (?, ?, ?)',
                [userId, 'user', message]
            );
            await db.query(
                'INSERT INTO ai_chats (user_id, role, content) VALUES (?, ?, ?)',
                [userId, 'assistant', aiReply]
            );

            res.json({ success: true, reply: aiReply });
        } catch (error) {
            console.error('AIChatController.chat error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Lấy lịch sử chat
    async getHistory(req, res) {
        const userId = req.user.id;
        try {
            const [rows] = await db.query(
                'SELECT role, content, created_at FROM ai_chats WHERE user_id = ? ORDER BY created_at ASC',
                [userId]
            );
            res.json({ success: true, history: rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Xoá toàn bộ lịch sử chat
    async clearHistory(req, res) {
        const userId = req.user.id;
        try {
            await db.query('DELETE FROM ai_chats WHERE user_id = ?', [userId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AIChatController();