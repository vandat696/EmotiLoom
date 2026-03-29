import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MOODS, Icon, Icons } from '../constants';
import MoodCalendar from '../../components/MoodCalendar';
import MoodStatistics from '../../components/MoodStatistics';

const API = process.env.REACT_APP_API_URL;
const api = axios.create({ baseURL: API });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function DiaryPage({ userRole }) {
  // Setup all hooks BEFORE any conditionals
  const [diaries, setDiaries] = useState([]);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('write');

  // Define async functions BEFORE useEffect
  const loadDiaries = async () => {
    try { const res = await api.get('/api/diary'); setDiaries(res.data.diaries || []); }
    catch (err) { console.error(err); }
  };

  // ALL useEffect BEFORE conditional return
  useEffect(() => { loadDiaries(); }, []);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Role check - conditional RENDER after all hooks
  if (userRole !== 'student') {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ color: '#999' }}>❌ Trang này chỉ dành cho học sinh</h3>
        <p style={{ color: '#999' }}>Vai trò của bạn: 👩‍⚕️ Nhà tham vấn</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!content.trim()) return alert('Hãy viết gì đó nhé!');
    setLoading(true);
    try {
      await api.post('/api/diary', { content, mood_emoji: selectedMood?.emoji, mood_score: selectedMood?.score });
      setContent(''); setSelectedMood(null); setView('history'); loadDiaries();
    } catch (err) { alert('Lỗi: ' + err.response?.data?.error); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá nhật ký này?')) return;
    try { await api.delete(`/api/diary/${id}`); loadDiaries(); }
    catch { alert('Lỗi khi xoá!'); }
  };

  return (
    <div className="page diary-page">
      <div className="page-header">
        <h2>📔 Nhật ký cá nhân</h2>
        <p>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="tab-row">
        <button className={`tab-btn ${view === 'write' ? 'active' : ''}`} onClick={() => setView('write')}>Viết mới</button>
        <button className={`tab-btn ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>Lịch sử ({diaries.length})</button>
        <button className={`tab-btn ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>Nhật kí cảm xúc</button>
      </div>
      {view === 'write' ? (
        <>
          <div className="diary-mood-row">
            <p className="mood-question">Hôm nay bạn cảm thấy thế nào?</p>
            <div className="mood-selector">
              {MOODS.map(m => (
                <button key={m.score} className={`mood-option ${selectedMood?.score === m.score ? 'selected' : ''}`}
                  style={selectedMood?.score === m.score ? { background: m.color + '25', borderColor: m.color } : {}}
                  onClick={() => setSelectedMood(m)}><span>{m.emoji}</span><span>{m.label}</span></button>
              ))}
            </div>
          </div>
          <div className="diary-editor">
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Hôm nay của bạn thế nào? Cứ viết thoải mái nhé... 🌸" rows={8} />
            <div className="diary-footer">
              <span className="char-count">{content.length} ký tự</span>
              <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? '✨ Đang lưu...' : '💾 Lưu nhật ký'}
              </button>
            </div>
          </div>
        </>
      ) : view === 'history' ? (
        <div className="diary-history">
          {diaries.length === 0 ? <div className="empty-state">📝 Chưa có nhật ký nào!</div>
            : diaries.map(d => (
              <div key={d.id} className="diary-item">
                <div className="diary-item-header">
                  <span className="diary-mood-emoji">{d.mood_emoji || '📝'}</span>
                  <span className="diary-date">{new Date(d.created_at).toLocaleString('vi-VN')}</span>
                  {d.sentiment && <span className="diary-sentiment">{d.sentiment}</span>}
                  <button className="delete-btn" onClick={() => handleDelete(d.id)}><Icon d={Icons.trash} size={15} /></button>
                </div>
                <p className="diary-content">{d.content}</p>
                {d.ai_advice && <div className="diary-advice">💡 {d.ai_advice}</div>}
              </div>
            ))}
        </div>
      ) : view === 'calendar' ? (
        <>
          <MoodCalendar diaries={diaries} />
          <MoodStatistics diaries={diaries} year={currentYear} month={currentMonth} />
        </>
      ) : null}
    </div>
  );
}
