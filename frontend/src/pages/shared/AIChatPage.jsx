import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Icon, Icons } from '../constants';

const API = process.env.REACT_APP_API_URL;
const api = axios.create({ baseURL: API });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const loadHistory = async () => {
    try { const res = await api.get('/api/ai-chat/history'); setMessages(res.data.history || []); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
