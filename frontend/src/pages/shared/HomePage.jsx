import React from 'react';
import { MOODS } from '../constants';

export default function HomePage({ user, userRole, onNavigate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const isCounselor = userRole === 'counselor';
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
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
            {isCounselor ? '✓ Tài khoản Nhà tham vấn' : '✓ Tài khoản Học sinh'}
          </p>
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
