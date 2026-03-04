const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'emotiloom_secret_key';
    }

    async register(req, res) {
        const { username, password } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create(username, hashedPassword);
            res.json({ success: true, message: "Đăng ký thành công!" });
        } catch (error) {
            res.status(500).json({ error: "Tên đăng nhập đã tồn tại!" });
        }
    }

    async login(req, res) {
        const { username, password } = req.body;
        try {
            const user = await User.findByUsername(username);
            if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ error: "Sai mật khẩu rồi!" });

            // Tạo token để ghi nhớ đăng nhập
            const token = jwt.sign({ id: user.id, role: user.role }, this.secret, { expiresIn: '1d' });
            
            res.json({ success: true, token, user: { username: user.username, role: user.role } });
        } catch (error) {
            res.status(500).json({ error: "Lỗi đăng nhập" });
        }
    }
}

module.exports = new AuthController();