const db = require('../models/Database');

class CommunityController {

    // Lấy danh sách bài đăng
    async getPosts(req, res) {
        try {
            const [rows] = await db.query(`
                SELECT p.*, u.username, u.role,
                    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
                    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
                FROM posts p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC
                LIMIT 50
            `);
            res.json({ success: true, posts: rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Tạo bài đăng mới
    async createPost(req, res) {
        const { content, tag } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        if (!content) return res.status(400).json({ error: 'Nội dung không được trống!' });

        // Nhà tham vấn chỉ đăng tag 'chuyen-gia'
        const finalTag = role === 'counselor' ? 'chuyen-gia' : (tag || 'chia-se');

        try {
            const [rows] = await db.query(
                'INSERT INTO posts (user_id, content, tag) VALUES (?,?,?)',
                [userId, content, finalTag]
            );
            res.json({ success: true, post_id: rows.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Xoá bài đăng (chỉ xoá của mình)
    async deletePost(req, res) {
        const { id } = req.params;
        const userId = req.user.id;
        try {
            await db.query('DELETE FROM posts WHERE id = ? AND user_id = ?', [id, userId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Lấy bình luận của 1 bài đăng
    async getComments(req, res) {
        const { post_id } = req.params;
        try {
            const [rows] = await db.query(`
                SELECT c.*, u.username, u.role
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ?
                ORDER BY c.created_at ASC
            `, [post_id]);
            res.json({ success: true, comments: rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Thêm bình luận
    async addComment(req, res) {
        const { post_id, content } = req.body;
        const userId = req.user.id;
        if (!content) return res.status(400).json({ error: 'Bình luận không được trống!' });

        try {
            const [rows] = await db.query(
                'INSERT INTO comments (post_id, user_id, content) VALUES (?,?,?)',
                [post_id, userId, content]
            );
            res.json({ success: true, comment_id: rows.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Toggle like (like/unlike)
    async toggleLike(req, res) {
        const { post_id } = req.body;
        const userId = req.user.id;
        try {
            const [existing] = await db.query(
                'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
                [post_id, userId]
            );
            if (existing.length > 0) {
                await db.query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [post_id, userId]);
                res.json({ success: true, liked: false });
            } else {
                await db.query('INSERT INTO likes (post_id, user_id) VALUES (?,?)', [post_id, userId]);
                res.json({ success: true, liked: true });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new CommunityController();