const express = require('express');
const mysql = require('mysql2');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// 1. Kết nối MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// 2. Cấu hình AI Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. API xử lý nhật ký
app.post('/api/diary', async (req, res) => {
    const { content } = req.body;
    console.log("Nội dung nhận được:", content);

    try {
        // Sử dụng model 'gemini-1.5-flash' hoặc 'gemini-pro'
        // Thêm cấu hình để AI trả về định dạng JSON thuần túy
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            generationConfig: { responseMimeType: "application/json" } 
        });

        const prompt = `Phân tích cảm xúc nhật ký sau: "${content}". 
        Trả về JSON: {"sentiment": "Vui/Buồn/Bình thường", "score": 1-10, "advice": "lời khuyên"}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Parse kết quả
        const analysis = JSON.parse(responseText);

        // LƯU Ý: Nếu chưa tạo bảng database hoặc kết nối DB lỗi, nó sẽ nhảy xuống catch
        const sql = "INSERT INTO diary_logs (content, sentiment, score, advice) VALUES (?, ?, ?, ?)";
        db.query(sql, [content, analysis.sentiment, analysis.score, analysis.advice], (err) => {
            if (err) {
                console.error("Lỗi MySQL:", err);
                return res.status(500).json({ error: "Lỗi lưu Database" });
            }
            res.json({ success: true, analysis });
        });

    } catch (error) {
        console.error("LỖI CHI TIẾT:", error);
        // Trả về lỗi chi tiết để Frontend hiển thị thay vì câu chung chung
        res.status(500).json({ error: error.message }); 
    }
});

app.listen(5000, () => console.log('🚀 EmotiLoom Backend is running on port 5000'));


///////////////////////////////////////// API ĐĂNG KÝ

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// API Đăng ký
app.post('/api/auth/register', async (req, res) => {
    const { username, password, role } = req.body; // role: 'student' hoặc 'counselor'

    try {
        // 1. Kiểm tra xem user đã tồn tại chưa
        db.query('SELECT username FROM users WHERE username = ?', [username], async (err, results) => {
            if (results.length > 0) return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });

            // 2. Băm mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Lưu vào DB
            db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
            [username, hashedPassword, role || 'student'], (err) => {
                if (err) throw err;
                res.json({ message: "Đăng ký thành công!" });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
});

////////////////////////////////////////////////

//////////////////////////////////////////////// API ĐĂNG NHẬP
// API Đăng nhập
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: "Sai tài khoản!" });

        const user = results[0];

        // So sánh mật khẩu băm
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu!" });

        // Tạo Token (hết hạn trong 1 ngày)
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            'bi_mat_emotiloom', // Đây là mã bí mật, nên để trong .env
            { expiresIn: '1d' }
        );

        res.json({ token, role: user.role, username: user.username });
    });
});
//////////////////////////////////////////////////////////