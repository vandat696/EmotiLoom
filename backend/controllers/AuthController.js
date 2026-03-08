const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'emotiloom_secret_key';
    }

    async register(req, res) {
        const { username, password, role } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            // Chỉ cho phép role là 'student' hoặc 'counselor', mặc định là 'student'
            const validRole = role === 'counselor' ? 'counselor' : 'student';
            await User.create(username, hashedPassword, validRole);
            res.json({ success: true, message: "Đăng ký thành công!" });
        } catch (error) {
            console.error('Register error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: "Tên đăng nhập đã tồn tại!" });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async login(req, res) {
        const { username, password } = req.body;
        try {
            const user = await User.findByUsername(username);
            if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ error: "Sai mật khẩu rồi!" });

            const token = jwt.sign({ id: user.id, role: user.role }, this.secret, { expiresIn: '1d' });

            res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AuthController();