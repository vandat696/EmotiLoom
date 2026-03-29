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
        console.log('🔐 Login attempt:', { username, password });
        try {
            // Admin hardcoded credentials for development/deployment
            if (username === 'admin' && password === '123456') {
                console.log('✅ Admin credentials matched!');
                const token = jwt.sign({ id: 0, role: 'admin' }, this.secret, { expiresIn: '1d' });
                return res.json({ 
                    success: true, 
                    token, 
                    user: { id: 0, username: 'admin', role: 'admin' } 
                });
            }

            // Regular user login from database
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

    // 🔑 Secret endpoint to setup initial admin (use with ADMIN_SETUP_TOKEN)
    async setupInitialAdmin(req, res) {
        const { setupToken, adminPassword } = req.body;
        const ENV_SETUP_TOKEN = process.env.ADMIN_SETUP_TOKEN;

        console.log('🔐 Setup Admin attempt received');

        // Verify secret token
        if (!setupToken || setupToken !== ENV_SETUP_TOKEN) {
            console.log('❌ Invalid or missing setup token');
            return res.status(403).json({ error: 'Invalid setup token' });
        }

        // Validate password
        if (!adminPassword || adminPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        try {
            // Check if admin already exists
            const [existingAdmin] = await User.findByUsername('admin');
            if (existingAdmin) {
                return res.status(409).json({ error: 'Admin user already exists' });
            }

            // Create admin user
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await User.create('admin', hashedPassword, 'admin');

            console.log('✅ Admin user created successfully');
            res.json({ 
                success: true, 
                message: 'Admin user created successfully',
                credentials: {
                    username: 'admin',
                    password: adminPassword,
                    role: 'admin'
                }
            });
        } catch (error) {
            console.error('❌ Setup admin error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AuthController();