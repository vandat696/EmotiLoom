const db = require('./Database');

class User {
    static async create(username, hashedPassword, role = 'student') {
        const sql = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
        return await db.query(sql, [username, hashedPassword, role]);
    }

    static async findByUsername(username) {
        const sql = "SELECT * FROM users WHERE username = ?";
        const [rows] = await db.query(sql, [username]);
        return rows[0]; // Trả về user đầu tiên tìm thấy
    }
}

module.exports = User;