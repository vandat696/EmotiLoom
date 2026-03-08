const jwt = require('jsonwebtoken');

class AuthMiddleware {
    static async verifyToken(req, res, next) {
        // Lấy token từ header "Authorization"
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(403).json({ error: "Cậu cần đăng nhập để thực hiện hành động này!" });
        }

        try {
            const secret = process.env.JWT_SECRET || 'emotiloom_secret_key';
            const decoded = jwt.verify(token, secret);
            
            // Lưu thông tin user vào request để các hàm sau sử dụng
            req.user = decoded; 
            next(); // Cho phép đi tiếp vào Controller
        } catch (err) {
            return res.status(401).json({ error: "Phiên đăng nhập hết hạn, hãy đăng nhập lại nhé." });
        }
    }
}

module.exports = AuthMiddleware.verifyToken;