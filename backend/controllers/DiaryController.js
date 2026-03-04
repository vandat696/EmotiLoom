const db = require('../models/Database');
const { GoogleGenerativeAI } = require("@google/generative-ai");

class DiaryController {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    async analyzeAndSave(req, res) {
        const { content } = req.body;
        
        try {
            // Logic gọi AI
            const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `Phân tích cảm xúc: "${content}". Trả về JSON: {"sentiment": "...", "score": 0, "advice": "..."}`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const analysis = JSON.parse(response.text().replace(/```json|```/g, "").trim());

            // Lưu vào DB bằng lớp Database
            const sql = "INSERT INTO diary_logs (content, sentiment, score, advice) VALUES (?, ?, ?, ?)";
            await db.query(sql, [content, analysis.sentiment, analysis.score, analysis.advice]);

            res.json({ success: true, analysis });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Lỗi hệ thống OOP: " + error.message });
        }
    }
}

module.exports = new DiaryController();