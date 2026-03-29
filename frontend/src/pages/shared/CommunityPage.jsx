import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Icon, Icons } from '../constants';

const API = process.env.REACT_APP_API_URL;
const api = axios.create({ baseURL: API });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function CommunityPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [tag, setTag] = useState('chia-se');
  const [showForm, setShowForm] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState('');

  const loadPosts = async () => {
    try { const res = await api.get('/api/posts'); setPosts(res.data.posts || []); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { loadPosts(); }, []);

  const createPost = async () => {
    if (!newPost.trim()) return alert('Nội dung trống!');
    try { await api.post('/api/posts', { content: newPost, tag }); setNewPost(''); setShowForm(false); loadPosts(); }
    catch (err) { alert('Lỗi: ' + err.response?.data?.error); }
  };

  const toggleLike = async (postId) => {
    try { await api.post('/api/likes', { post_id: postId }); loadPosts(); }
    catch (err) { console.error(err); }
  };

  const toggleComments = async (postId) => {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    try { const res = await api.get(`/api/posts/${postId}/comments`); setComments(prev => ({ ...prev, [postId]: res.data.comments })); }
    catch (err) { console.error(err); }
  };

  const addComment = async (postId) => {
    if (!commentInput.trim()) return;
    try {
      await api.post('/api/comments', { post_id: postId, content: commentInput });
      setCommentInput('');
      const res = await api.get(`/api/posts/${postId}/comments`);
      setComments(prev => ({ ...prev, [postId]: res.data.comments }));
      loadPosts();
    } catch { alert('Lỗi!'); }
  };

  const tagConfig = {
    'chia-se': { label: 'Chia sẻ', color: '#6BCB77', bg: '#F0FAF2' },
    'hoi-dap': { label: 'Hỏi đáp', color: '#FF9B9B', bg: '#FFF0F0' },
    'chuyen-gia': { label: 'Chuyên gia', color: '#4D96FF', bg: '#EEF4FF' },
  };

  return (
    <div className="page community-page">
      <div className="page-header"><h2>🌿 Cộng đồng</h2><p>Chia sẻ và kết nối cùng mọi người</p></div>
      <button className="new-post-btn" onClick={() => setShowForm(!showForm)}>{showForm ? '✕ Đóng' : '✏️ Viết bài mới'}</button>
      {showForm && (
        <div className="post-form">
          {user?.role === 'student' && (
            <div className="tag-select">
              {['chia-se', 'hoi-dap'].map(t => (
                <button key={t} className={`tag-btn ${tag === t ? 'active' : ''}`}
                  style={tag === t ? { background: tagConfig[t].bg, color: tagConfig[t].color, borderColor: tagConfig[t].color } : {}}
                  onClick={() => setTag(t)}>{tagConfig[t].label}</button>
              ))}
            </div>
          )}
          <textarea rows={4} value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Bạn muốn chia sẻ điều gì?" />
          <div className="post-form-footer">
            <span className="char-count">{newPost.length} ký tự</span>
            <button className="submit-btn" onClick={createPost}>📤 Đăng bài</button>
          </div>
        </div>
      )}
      <div className="posts-list">
        {posts.length === 0 ? <div className="empty-state">🌱 Chưa có bài đăng nào!</div>
          : posts.map(post => {
            const t = tagConfig[post.tag] || tagConfig['chia-se'];
            return (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <span className="post-avatar">{post.role === 'counselor' ? '👩‍⚕️' : '🧑'}</span>
                  <div>
                    <span className="post-author">{post.username}</span>
                    {post.role === 'counselor' && <span className="counselor-badge">Tham vấn viên</span>}
                    <span className="post-time">{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <span className="post-tag" style={{ background: t.bg, color: t.color }}>{t.label}</span>
                </div>
                <p className="post-content">{post.content}</p>
                <div className="post-actions">
                  <button className="action-btn" onClick={() => toggleLike(post.id)}>❤️ {post.like_count}</button>
                  <button className="action-btn" onClick={() => toggleComments(post.id)}>💬 {post.comment_count}</button>
                  {post.user_id === user?.id && (
                    <button className="action-btn delete" onClick={async () => { if (window.confirm('Xoá bài?')) { await api.delete(`/api/posts/${post.id}`); loadPosts(); } }}>🗑️</button>
                  )}
                </div>
                {expandedPost === post.id && (
                  <div className="comments-section">
                    {(comments[post.id] || []).map((c, i) => (
                      <div key={i} className="comment-item">
                        <span className="comment-avatar">{c.role === 'counselor' ? '👩‍⚕️' : '🧑'}</span>
                        <div className="comment-body"><span className="comment-author">{c.username}</span><p>{c.content}</p></div>
                      </div>
                    ))}
                    <div className="comment-input-row">
                      <input value={commentInput} onChange={e => setCommentInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addComment(post.id)} placeholder="Viết bình luận..." />
                      <button className="send-btn small" onClick={() => addComment(post.id)}><Icon d={Icons.send} size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
