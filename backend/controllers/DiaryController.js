const db = require('../models/Database');
const { GoogleGenAI } = require("@google/genai");

class DiaryController {
    constructor() {
        this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    async analyzeAndSave(req, res) {
        const { content } = req.body;
        
        try {
            const prompt = `Phân tích cảm xúc: "${content}". Trả về JSON: {"sentiment": "...", "score": 0, "advice": "..."}`;
            
            const result = await this.genAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
            const rawText = result.text.replace(/```json|```/g, "").trim();
            const analysis = JSON.parse(rawText);

            const userId = req.user.id;
            const sql = "INSERT INTO diary_logs (content, sentiment, score, advice, user_id) VALUES (?, ?, ?, ?, ?)";
            await db.query(sql, [content, analysis.sentiment, analysis.score, analysis.advice, userId]);

            res.json({ success: true, analysis });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
        }
    }
}

module.exports = new DiaryController();