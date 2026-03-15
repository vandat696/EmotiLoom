import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;
const api = axios.create({ baseURL: API });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function MessageChat({ appointmentId, otherUserName, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-reload messages mỗi 2 giây
  useEffect(() => {
    if (!appointmentId) return;
    
    const interval = setInterval(() => {
      loadMessages();
    }, 2000); // Load mỗi 2 giây
    
    return () => clearInterval(interval); // Cleanup khi unmount
  }, [appointmentId]);

  // Scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/api/messages/${appointmentId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Load messages error:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const msg = input;
    setMessages(prev => [...prev, { 
      sender_id: currentUser?.id, 
      sender_name: currentUser?.username || 'Bạn',
      content: msg, 
      created_at: new Date().toISOString() 
    }]);
    setInput('');
    setLoading(true);

    try {
      await api.post('/api/messages', { appointment_id: appointmentId, content: msg });
      //await loadMessages(); // Reload để lấy message từ server confirm
    } catch (err) {
      console.error('Send message error:', err);
      alert('Lỗi gửi tin nhắn!');
    }
    setLoading(false);
  };

  const clearHistory = async () => {
    if (!window.confirm('Xoá toàn bộ hội thoại này?')) return;
    try {
      // API này cần thêm vào backend
      // await api.delete(`/api/messages/${appointmentId}`);
      setMessages([]);
    } catch {
      alert('Lỗi!');
    }
  };

  return (
    <div className="message-chat-container">
      <div className="chat-header">
        <h3>💬 {otherUserName}</h3>
        {messages.length > 0 && (
          <button className="clear-btn" onClick={clearHistory}>🗑️ Xoá</button>
        )}
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <span>💬</span>
            <p>Bắt đầu cuộc hội thoại với {otherUserName}</p>
          </div>
        ) : (
        // MessageChat.js
        messages.map((m, i) => {
          const isOwn = m.sender_id === currentUser?.id;
          const senderDisplay = isOwn ? (currentUser?.username || 'Bạn') : m.sender_name;
          return (
            <div 
              key={i} 
              className={`chat-bubble ${isOwn ? 'own' : 'other'}`}
              onMouseMove={(e) => {
                const info = e.currentTarget.querySelector('.bubble-info');
                if (info) {
                  info.style.left = (e.clientX + 15) + 'px';
                  info.style.top = (e.clientY + 15) + 'px';
                }
              }}
            >
              <div className="bubble-info">
                <span className="bubble-sender">{senderDisplay}</span>
                {m.created_at && (
                  <span className="bubble-time">
                    {new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="bubble-content">{m.content}</div>
            </div>
          );
        })
        )}
        {loading && (
          <div className="chat-bubble other">
            <div className="bubble-info">
              <span className="bubble-sender">{otherUserName}</span>
            </div>
            <div className="bubble-content typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input className="chat-placeholder"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Nhập tin nhắn..."
          disabled={loading}
        />
        <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
          📤
        </button>
      </div>
    </div>
  );
}