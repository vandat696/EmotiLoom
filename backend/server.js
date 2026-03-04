require('dotenv').config();
const express = require('express');
const cors = require('cors');


const diaryController = require('./controllers/DiaryController');
const authController = require('./controllers/AuthController');
const AuthMiddleware = require('./middleware/AuthMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

// Routes cho Authentication
app.post('/api/auth/register', (req, res) => authController.register(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));

// Route này CẦN đăng nhập (Thêm AuthMiddleware.verifyToken vào giữa)
app.post('/api/diary', AuthMiddleware.verifyToken, (req, res) => diaryController.analyzeAndSave(req, res));

// Khởi chạy server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`EmotiLoom OOP Backend running on port ${PORT}`);
});
