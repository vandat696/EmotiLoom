const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/AuthMiddleware');

const AuthController = require('../controllers/AuthController');
const DiaryController = require('../controllers/DiaryController');
const AIChatController = require('../controllers/AIChatController');
const AppointmentController = require('../controllers/AppointmentController');
const CommunityController = require('../controllers/CommunityController');

// ── AUTH (không cần token) ────────────────────────────────────────────────────
router.post('/auth/register', (req, res) => AuthController.register(req, res));
router.post('/auth/login', (req, res) => AuthController.login(req, res));

// ── DIARY (cần token) ─────────────────────────────────────────────────────────
router.post('/diary', authMiddleware, (req, res) => DiaryController.create(req, res));
router.get('/diary', authMiddleware, (req, res) => DiaryController.getAll(req, res));
router.delete('/diary/:id', authMiddleware, (req, res) => DiaryController.delete(req, res));

// ── AI CHAT (cần token) ───────────────────────────────────────────────────────
router.post('/ai-chat', authMiddleware, (req, res) => AIChatController.chat(req, res));
router.get('/ai-chat/history', authMiddleware, (req, res) => AIChatController.getHistory(req, res));
router.delete('/ai-chat/history', authMiddleware, (req, res) => AIChatController.clearHistory(req, res));

// ── COUNSELORS ────────────────────────────────────────────────────────────────
router.get('/counselors', authMiddleware, (req, res) => AppointmentController.getCounselors(req, res));
router.put('/counselors/profile', authMiddleware, (req, res) => AppointmentController.updateProfile(req, res));

// ── APPOINTMENTS ──────────────────────────────────────────────────────────────
router.post('/appointments', authMiddleware, (req, res) => AppointmentController.book(req, res));
router.get('/appointments', authMiddleware, (req, res) => AppointmentController.getMyAppointments(req, res));
router.put('/appointments/:id/status', authMiddleware, (req, res) => AppointmentController.updateStatus(req, res));

// ── MESSAGES ──────────────────────────────────────────────────────────────────
router.post('/messages', authMiddleware, (req, res) => AppointmentController.sendMessage(req, res));
router.get('/messages/:appointment_id', authMiddleware, (req, res) => AppointmentController.getMessages(req, res));

// ── COMMUNITY ─────────────────────────────────────────────────────────────────
router.get('/posts', authMiddleware, (req, res) => CommunityController.getPosts(req, res));
router.post('/posts', authMiddleware, (req, res) => CommunityController.createPost(req, res));
router.delete('/posts/:id', authMiddleware, (req, res) => CommunityController.deletePost(req, res));
router.get('/posts/:post_id/comments', authMiddleware, (req, res) => CommunityController.getComments(req, res));
router.post('/comments', authMiddleware, (req, res) => CommunityController.addComment(req, res));
router.post('/likes', authMiddleware, (req, res) => CommunityController.toggleLike(req, res));

module.exports = router;