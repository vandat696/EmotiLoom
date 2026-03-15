import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import MessageChat from './MessageChat';

const API = process.env.REACT_APP_API_URL;
const api = axios.create({ baseURL: API });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const MOODS = [
  { emoji: '😄', label: 'Tuyệt vời', score: 5, color: '#FFD93D' },
  { emoji: '🙂', label: 'Tốt', score: 4, color: '#6BCB77' },
  { emoji: '😐', label: 'Bình thường', score: 3, color: '#4D96FF' },
  { emoji: '😔', label: 'Không tốt', score: 2, color: '#FF9B9B' },
  { emoji: '😢', label: 'Tệ', score: 1, color: '#C77DFF' },
];

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const Icons = {
  home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  diary: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8'],
  ai: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
  counselor: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 4 4A4 4 0 0 0 9 3z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  community: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  send: ['M22 2L11 13', 'M22 2L15 22 11 13 2 9l20-7z'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  calendar: ['M3 4h18v18H3z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!form.username || !form.password) return alert('Vui lòng điền đầy đủ!');
    setLoading(true);
    try {
      const res = await api.post(`/api/auth/${isRegister ? 'register' : 'login'}`, form);
      if (isRegister) { alert('Đăng ký thành công! 🌸'); setIsRegister(false); }
      else {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) { alert(err.response?.data?.error || 'Có lỗi xảy ra!'); }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-blob blob-1" /><div className="auth-blob blob-2" /><div className="auth-blob blob-3" />
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">🌸</span>
          <h1 className="logo-text">EmotiLoom</h1>
          <p className="logo-sub">Không gian an toàn cho cảm xúc của bạn</p>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${!isRegister ? 'active' : ''}`} onClick={() => setIsRegister(false)}>Đăng nhập</button>
          <button className={`auth-tab ${isRegister ? 'active' : ''}`} onClick={() => setIsRegister(true)}>Đăng ký</button>
        </div>
        <div className="auth-form">
          <div className="input-group"><label>Tên đăng nhập</label>
            <input type="text" placeholder="Nhập tên..." value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="input-group"><label>Mật khẩu</label>
            <input type="password" placeholder="Nhập mật khẩu..." value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleAuth()} />
          </div>
          {isRegister && (
            <div className="input-group"><label>Tư cách</label>
              <div className="role-select">
                <button className={`role-btn ${form.role === 'student' ? 'active' : ''}`} onClick={() => setForm({ ...form, role: 'student' })}>🎓 Học sinh</button>
                <button className={`role-btn ${form.role === 'counselor' ? 'active' : ''}`} onClick={() => setForm({ ...form, role: 'counselor' })}>👩‍⚕️ Nhà tham vấn</button>
              </div>
            </div>
          )}
          <button className="auth-btn" onClick={handleAuth} disabled={loading}>
            {loading ? '⏳ Đang xử lý...' : isRegister ? '✨ Tạo tài khoản' : '🌸 Bắt đầu hành trình'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({ user, onNavigate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const isCounselor = user?.role === 'counselor';
  const cards = isCounselor ? [
    { id: 'counseling', icon: '💬', bg: '#FFF8E7', title: 'Tham vấn', desc: 'Quản lý học sinh và lịch hẹn' },
    { id: 'ai', icon: '🤖', bg: '#F0F5FF', title: 'Chat với AI', desc: 'Trợ lý AI hỗ trợ công việc' },
    { id: 'community', icon: '🌿', bg: '#F0FAF2', title: 'Cộng đồng', desc: 'Chia sẻ kiến thức' },
  ] : [
    { id: 'diary', icon: '📔', bg: '#FFF0F5', title: 'Nhật ký cá nhân', desc: 'Ghi lại cảm xúc và suy nghĩ' },
    { id: 'ai', icon: '🤖', bg: '#F0F5FF', title: 'Chat với AI', desc: 'Nhận hỗ trợ từ trợ lý AI' },
    { id: 'counselor', icon: '💬', bg: '#FFF8E7', title: 'Đặt lịch tham vấn', desc: 'Kết nối với chuyên gia tâm lý' },
    { id: 'community', icon: '🌿', bg: '#F0FAF2', title: 'Cộng đồng', desc: 'Chia sẻ và kết nối' },
  ];

  return (
    <div className="page home-page">
      <div className="home-hero">
        <div className="home-greeting">
          <h2>{greeting}, <span>{user?.username}</span> {isCounselor ? '👩‍⚕️' : '🌸'}</h2>
          <p>{isCounselor ? 'Chào mừng bạn đến không gian làm việc' : 'Hôm nay bạn cảm thấy thế nào?'}</p>
        </div>
        {!isCounselor && (
          <div className="mood-quick-select">
            {MOODS.map(m => (
              <button key={m.score} className="mood-btn" onClick={() => onNavigate('diary')}>
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-label">{m.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="home-cards">
        {cards.map(c => (
          <div key={c.id} className="home-card" onClick={() => onNavigate(c.id)}>
            <div className="card-icon" style={{ background: c.bg }}>{c.icon}</div>
            <div className="card-info"><h3>{c.title}</h3><p>{c.desc}</p></div>
            <span className="card-arrow">→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DIARY ────────────────────────────────────────────────────────────────────
function DiaryPage() {
  const [diaries, setDiaries] = useState([]);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('write');

  useEffect(() => { loadDiaries(); }, []);

  const loadDiaries = async () => {
    try { const res = await api.get('/api/diary'); setDiaries(res.data.diaries || []); }
    catch (err) { console.error(err); }
  };

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
        <button className={`tab-btn ${view === 'write' ? 'active' : ''}`} onClick={() => setView('write')}>✍️ Viết mới</button>
        <button className={`tab-btn ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>📚 Lịch sử ({diaries.length})</button>
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
      ) : (
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
      )}
    </div>
  );
}

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadHistory = async () => {
    try { const res = await api.get('/api/ai-chat/history'); setMessages(res.data.history || []); }
    catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput(''); setLoading(true);
    try {
      const res = await api.post('/api/ai-chat', { message: msg });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: '❌ Có lỗi xảy ra!' }]); }
    setLoading(false);
  };

  const clearHistory = async () => {
    if (!window.confirm('Xoá toàn bộ lịch sử?')) return;
    try { await api.delete('/api/ai-chat/history'); setMessages([]); }
    catch { alert('Lỗi!'); }
  };

  return (
    <div className="page ai-chat-page">
      <div className="page-header chat-header">
        <div><h2>🤖 Chat với AI</h2><p>Trợ lý tâm lý ảo EmotiLoom</p></div>
        {messages.length > 0 && <button className="clear-btn" onClick={clearHistory}><Icon d={Icons.trash} size={15} /> Xoá</button>}
      </div>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome"><span>🌸</span><h3>Xin chào! Mình là trợ lý AI</h3><p>Hãy chia sẻ cảm xúc, mình luôn lắng nghe!</p></div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              <div className="bubble-avatar">{m.role === 'user' ? '👤' : '🤖'}</div>
              <div className="bubble-content">{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble assistant">
              <div className="bubble-avatar">🤖</div>
              <div className="bubble-content typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-row">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Nhắn tin với AI..." disabled={loading} />
          <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}><Icon d={Icons.send} size={18} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── COUNSELOR LIST (for students) ───────────────────────────────────────────
function CounselorPage({ user }) {
  const [counselors, setCounselors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ date: '', time: '', note: '' });
  const [myAppointments, setMyAppointments] = useState([]);
  const [view, setView] = useState('list');
  const [openChats, setOpenChats] = useState([]); // Array chứa nhiều chats đang mở

  useEffect(() => { loadCounselors(); loadMyAppointments(); }, []);

  const loadCounselors = async () => {
    try { const res = await api.get('/api/counselors'); setCounselors(res.data.counselors || []); }
    catch (err) { console.error(err); }
  };

  const loadMyAppointments = async () => {
    try { const res = await api.get('/api/appointments'); setMyAppointments(res.data.appointments || []); }
    catch (err) { console.error(err); }
  };

  const handleBook = async () => {
    if (!form.date || !form.time) return alert('Chọn ngày và giờ!');
    try {
      await api.post('/api/appointments', { counselor_id: selected.id, appointment_date: form.date, appointment_time: form.time, note: form.note });
      alert('Đặt lịch thành công! 🎉'); setSelected(null); setForm({ date: '', time: '', note: '' }); loadMyAppointments();
    } catch (err) { alert('Lỗi: ' + err.response?.data?.error); }
  };

  const statusLabel = { pending: '⏳ Chờ xác nhận', confirmed: '✅ Đã xác nhận', completed: '🎉 Hoàn thành', cancelled: '❌ Đã huỷ' };

  return (
    <div className="page counselor-page">
      <div className="page-header"><h2>💬 Tham vấn</h2><p>Đặt lịch với nhà tham vấn</p></div>
      <div className="tab-row">
        <button className={`tab-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>👩‍⚕️ Nhà tham vấn</button>
        <button className={`tab-btn ${view === 'my' ? 'active' : ''}`} onClick={() => setView('my')}>📅 Lịch hẹn của tôi ({myAppointments.length})</button>
      </div>

      {view === 'list' ? (
        <div className="counselor-grid">
          {counselors.length === 0 ? <div className="empty-state">👩‍⚕️ Chưa có nhà tham vấn nào!</div>
            : counselors.map(c => (
              <div key={c.id} className="counselor-card">
                <div className="counselor-avatar">👩‍⚕️</div>
                <div className="counselor-info">
                  <h3>{c.full_name || c.username}</h3>
                  {c.specialty && <p className="specialty">🎯 {c.specialty}</p>}
                  {c.experience_years > 0 && <p className="experience">⏱ {c.experience_years} năm kinh nghiệm</p>}
                  {c.bio && <p className="bio">{c.bio}</p>}
                  <span className={`status-badge ${c.is_available ? 'available' : 'busy'}`}>
                    {c.is_available ? '🟢 Có thể đặt lịch' : '🔴 Đang bận'}
                  </span>
                </div>
                <button className="book-btn" disabled={!c.is_available} onClick={() => setSelected(c)}>
                  {c.is_available ? '📅 Đặt lịch hẹn' : 'Không khả dụng'}
                </button>
              </div>
            ))}
        </div>
      ) : (
        <div className="appointments-simple">
          {myAppointments.length === 0 ? <div className="empty-state">📭 Chưa có lịch hẹn nào</div>
            : myAppointments.map(a => (
              <div 
                key={a.id} 
                className="appointment-item"
                onClick={() => {
                  if (a.status === 'confirmed') {
                    // Kiểm tra xem appointment này đã mở chưa
                    const isAlreadyOpen = openChats.some(chat => chat.id === a.id);
                    if (!isAlreadyOpen) {
                      setOpenChats(prev => [...prev, a]); // Thêm vào danh sách
                    }
                  }
                }}
                style={{ cursor: a.status === 'confirmed' ? 'pointer' : 'default' }}
              >
                <div className="appt-info">
                  <span className="appt-name">👩‍⚕️ {a.counselor_name}</span>
                  <span className="appt-datetime">📅 {new Date(a.appointment_date).toLocaleDateString('vi-VN')} lúc {a.appointment_time?.slice(0, 5)}</span>
                  {a.note && <span className="appt-note">📝 {a.note}</span>}
                </div>
                <span className={`status-tag ${a.status}`}>{statusLabel[a.status]}</span>
                {a.status === 'confirmed' && <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#667eea', fontWeight: 'bold' }}>💬 Click để chat</span>}
              </div>
            ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📅 Đặt lịch với {selected.full_name}</h3>
            <div className="input-group"><label>Ngày hẹn</label>
              <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="input-group"><label>Giờ hẹn</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="input-group"><label>Ghi chú (tuỳ chọn)</label>
              <textarea rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Bạn muốn trao đổi về điều gì..." />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setSelected(null)}>Huỷ</button>
              <button className="confirm-btn" onClick={handleBook}>✅ Xác nhận</button>
            </div>
          </div>
        </div>
      )}
      {/* Multiple chat windows */}
      {openChats.map((chat, index) => (
        <div 
          key={chat.id}
          style={{
            position: 'fixed',
            right: 20 + (index * 340), // Stack từ phải sang trái
            bottom: 20,
            width: '320px',
            height: '500px',
            zIndex: 200 + index,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '12px'
          }}
        >
          <MessageChat 
            appointmentId={chat.id}
            otherUserName={chat.counselor_name}
            currentUser={user}
            onClose={() => {
              setOpenChats(prev => prev.filter(c => c.id !== chat.id));
            }}
          />
        </div>
      ))}      
    </div>
  );
}

// ─── COUNSELOR MANAGEMENT PAGE (for counselors) ──────────────────────────────
function CounselorManagementPage({ user }) {
  const [tab, setTab] = useState('requests');
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [profile, setProfile] = useState({ full_name: '', specialty: '', experience_years: '', bio: '', is_available: true });
  const [profileSaving, setProfileSaving] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { loadAppointments(); }, []);
  // Auto-reload messages khi nhà tham vấn đang xem chat
  useEffect(() => {
    if (!selectedAppt) return;
    
    const interval = setInterval(() => {
      loadMessages(selectedAppt.id);
    }, 2000); // Load mỗi 2 giây
    
    return () => clearInterval(interval); // Cleanup
  }, [selectedAppt]);  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      await api.put('/api/counselors/profile', { ...profile, experience_years: parseInt(profile.experience_years) || 0 });
      alert('Cập nhật hồ sơ thành công! 🎉');
    } catch (err) { alert('Lỗi: ' + err.response?.data?.error); }
    setProfileSaving(false);
  };

  const loadAppointments = async () => {
    try { const res = await api.get('/api/appointments'); setAppointments(res.data.appointments || []); }
    catch (err) { console.error(err); }
  };

  const loadMessages = async (id) => {
    try { const res = await api.get(`/api/messages/${id}`); setChatMessages(res.data.messages || []); }
    catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try { await api.put(`/api/appointments/${id}/status`, { status }); loadAppointments(); }
    catch { alert('Lỗi!'); }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedAppt) return;
    try {
      await api.post('/api/messages', { appointment_id: selectedAppt.id, content: chatInput });
      setChatInput('');
      setTimeout(() => loadMessages(selectedAppt.id), 1000); // Delay 0.5s rồi load
    } catch { alert('Lỗi!'); }
  };

  const statusLabel = { pending: '⏳ Chờ', confirmed: '✅ Xác nhận', completed: '🎉 Xong', cancelled: '❌ Huỷ' };

  // Lọc theo tab
  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed' || a.status === 'completed');

  // Danh sách học sinh duy nhất
  const students = [...new Map(appointments.map(a => [a.student_username, {
    username: a.student_username,
    total: appointments.filter(x => x.student_username === a.student_username).length,
    latest: appointments.filter(x => x.student_username === a.student_username).sort((x, y) => new Date(y.appointment_date) - new Date(x.appointment_date))[0],
  }])).values()];

  const renderList = () => {
    if (tab === 'students') return (
      <div className="appointments-list">
        {students.length === 0 ? <div className="empty-state">👥 Chưa có học sinh nào</div>
          : students.map((s, i) => (
            <div key={i} className="appointment-item">
              <div className="appt-info">
                <span className="appt-name">🎓 {s.username}</span>
                <span className="appt-datetime">📅 {s.total} lượt hẹn · Gần nhất: {new Date(s.latest.appointment_date).toLocaleDateString('vi-VN')}</span>
                <span className={`status-tag ${s.latest.status}`}>{statusLabel[s.latest.status]}</span>
              </div>
            </div>
          ))}
      </div>
    );

    if (tab === 'requests') return (
      <div className="appointments-list">
        {pending.length === 0 ? <div className="empty-state">✅ Không có yêu cầu nào đang chờ</div>
          : pending.map(a => (
            <div key={a.id} className="appointment-item">
              <div className="appt-info">
                <span className="appt-name">🎓 {a.student_username}</span>
                <span className="appt-datetime">📅 {new Date(a.appointment_date).toLocaleDateString('vi-VN')} lúc {a.appointment_time?.slice(0,5)}</span>
                {a.note && <span className="appt-note">📝 {a.note}</span>}
              </div>
              <div className="appt-right">
                <span className="status-tag pending">⏳ Chờ xác nhận</span>
                <div className="appt-actions">
                  <button className="appt-btn confirm" title="Xác nhận" onClick={() => updateStatus(a.id, 'confirmed')}>✅</button>
                  <button className="appt-btn cancel" title="Huỷ" onClick={() => updateStatus(a.id, 'cancelled')}>❌</button>
                </div>
              </div>
            </div>
          ))}
      </div>
    );

    if (tab === 'appointments') return (
      <div className="appointments-layout">
        <div className="appointments-list">
          {confirmed.length === 0 ? <div className="empty-state">📭 Chưa có lịch hẹn nào</div>
            : confirmed.map(a => (
              <div 
                key={a.id}
                className="appointment-item"
                onClick={() => a.status === 'confirmed' && setSelectedAppt(a)}
                style={{ cursor: a.status === 'confirmed' ? 'pointer' : 'default' }}
              >
                <div className="appt-info">
                  <span className="appt-name">👩‍⚕️ {a.counselor_name}</span>
                  <span className="appt-datetime">📅 {new Date(a.appointment_date).toLocaleDateString('vi-VN')} lúc {a.appointment_time?.slice(0, 5)}</span>
                  {a.note && <span className="appt-note">📝 {a.note}</span>}
                </div>
                <span className={`status-tag ${a.status}`}>{statusLabel[a.status]}</span>
                {a.status === 'confirmed' && <span className="chat-hint">💬 Click để chat</span>}
              </div>
            ))}
        </div>
        {selectedAppt && (
          <div className="appt-chat">
            <div className="appt-chat-header">💬 Chat với {selectedAppt.student_username}</div>
            <div className="chat-messages">
              {chatMessages.length === 0 && <div className="chat-welcome"><span>💬</span><p>Bắt đầu trò chuyện!</p></div>}
              {chatMessages.map((m, i) => {
                const isOwn = m.sender_id === user?.id;
                return (
                    <div 
                      key={i} 
                      className={`chat-bubble ${isOwn ? 'own' : 'other'}`}
                      onMouseMove={(e) => {
                        const info = e.currentTarget.querySelector('.bubble-info');
                        if (info) {
                          // Lấy vị trí chuột và cộng thêm 15px để lệch sang phải/dưới
                          info.style.left = (e.clientX + 15) + 'px';
                          info.style.top = (e.clientY + 15) + 'px';
                          }
                      }}
                    >
                    <div className="bubble-info">
                      <span className="bubble-sender">{isOwn ? (user?.username || 'Bạn') : m.sender_name}</span>
                      {m.created_at && (
                        <span className="bubble-time">
                          {new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="bubble-content">{m.content}</div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="chat-input-row">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Nhắn tin..." />
              <button className="send-btn" onClick={sendMessage}><Icon d={Icons.send} size={18} /></button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page appointments-page">
      <div className="page-header">
        <h2>💬 Tham vấn</h2>
        <p>Quản lý học sinh và lịch hẹn</p>
      </div>
      <div className="tab-row">
        <button className={`tab-btn ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          📥 Yêu cầu {pending.length > 0 && <span className="badge">{pending.length}</span>}
        </button>
        <button className={`tab-btn ${tab === 'appointments' ? 'active' : ''}`} onClick={() => { setTab('appointments'); setSelectedAppt(null); }}>
          📅 Lịch hẹn ({confirmed.length})
        </button>
        <button className={`tab-btn ${tab === 'students' ? 'active' : ''}`} onClick={() => setTab('students')}>
          👥 Học sinh ({students.length})
        </button>
        <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
          👤 Hồ sơ
        </button>
      </div>
      {tab === 'profile' ? (
        <div className="profile-form">
          <div className="input-group"><label>Họ tên đầy đủ</label>
            <input type="text" placeholder="Nguyễn Thị A..." value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} />
          </div>
          <div className="input-group"><label>Chuyên môn</label>
            <input type="text" placeholder="Tâm lý học đường, lo âu, trầm cảm..." value={profile.specialty} onChange={e => setProfile({...profile, specialty: e.target.value})} />
          </div>
          <div className="input-group"><label>Số năm kinh nghiệm</label>
            <input type="number" min="0" placeholder="0" value={profile.experience_years} onChange={e => setProfile({...profile, experience_years: e.target.value})} />
          </div>
          <div className="input-group"><label>Giới thiệu bản thân</label>
            <textarea rows={4} placeholder="Viết đôi điều về bản thân và phương pháp làm việc..." value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Trạng thái</label>
            <div className="role-select">
              <button className={`role-btn ${profile.is_available ? 'active' : ''}`} onClick={() => setProfile({...profile, is_available: true})}>🟢 Sẵn sàng nhận lịch</button>
              <button className={`role-btn ${!profile.is_available ? 'active' : ''}`} onClick={() => setProfile({...profile, is_available: false})}>🔴 Tạm dừng</button>
            </div>
          </div>
          <button className="submit-btn" onClick={saveProfile} disabled={profileSaving}>
            {profileSaving ? '⏳ Đang lưu...' : '💾 Lưu hồ sơ'}
          </button>
        </div>
      ) : renderList()}
    </div>
  );
}

// ─── COMMUNITY ────────────────────────────────────────────────────────────────
function CommunityPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [tag, setTag] = useState('chia-se');
  const [showForm, setShowForm] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState('');

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    try { const res = await api.get('/api/posts'); setPosts(res.data.posts || []); }
    catch (err) { console.error(err); }
  };

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

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const [page, setPage] = useState('home');

  const handleLogin = (u) => { setUser(u); setIsLoggedIn(true); };
  const handleLogout = () => { localStorage.clear(); setIsLoggedIn(false); setUser(null); };

  if (!isLoggedIn) return <AuthPage onLogin={handleLogin} />;

  const isCounselor = user?.role === 'counselor';
  const studentNav = [
    { id: 'home', label: 'Trang chủ', icon: Icons.home },
    { id: 'diary', label: 'Nhật ký', icon: Icons.diary },
    { id: 'ai', label: 'Chat AI', icon: Icons.ai },
    { id: 'counselor', label: 'Tham vấn', icon: Icons.counselor },
    { id: 'community', label: 'Cộng đồng', icon: Icons.community },
  ];
  const counselorNav = [
    { id: 'home', label: 'Trang chủ', icon: Icons.home },
    { id: 'counseling', label: 'Tham vấn', icon: Icons.counselor },
    { id: 'ai', label: 'Chat AI', icon: Icons.ai },
    { id: 'community', label: 'Cộng đồng', icon: Icons.community },
  ];
  const navItems = isCounselor ? counselorNav : studentNav;

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage user={user} onNavigate={setPage} />;
      case 'diary': return <DiaryPage />;
      case 'ai': return <AIChatPage />;
      case 'counselor': return <CounselorPage user={user} />;
      case 'counseling': return <CounselorManagementPage user={user} />;
      case 'community': return <CommunityPage user={user} />;
      default: return <HomePage user={user} onNavigate={setPage} />;
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo"><span>🌸</span><span>EmotiLoom</span></div>
        {isCounselor && <div className="role-badge">👩‍⚕️ Tham vấn viên</div>}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
              <Icon d={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="user-avatar">{isCounselor ? '👩‍⚕️' : '👤'}</span>
          <span className="user-name">{user?.username}</span>
          <button className="logout-btn" onClick={handleLogout}><Icon d={Icons.logout} size={18} /></button>
        </div> 
      </aside>
      <main className="main-content">{renderPage()}</main>
      <nav className="bottom-nav">
        {navItems.map(item => (
          <button key={item.id} className={`bottom-nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
            <Icon d={item.icon} /><span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}