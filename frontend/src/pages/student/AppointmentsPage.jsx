import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API = process.env.REACT_APP_API_URL;
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function AppointmentsPage({ userRole }) {
  // Setup all hooks BEFORE conditionals
  const [counselors, setCounselors] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('book');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const socketRef = React.useRef(null);
  const selectedApptRef = React.useRef(null);
  const messageEndRef = React.useRef(null);

  // Define async functions BEFORE useEffect
  const loadCounselors = async () => {
    try { const res = await api.get('/api/counselors'); setCounselors(res.data.counselors || []); }
    catch (err) { console.error(err); }
  };

  const loadMyAppointments = async () => {
    try { 
      const res = await api.get('/api/appointments'); 
      setMyAppointments(res.data.appointments || []);
      console.log('✅ Appointments loaded:', res.data.appointments);
    }
    catch (err) { console.error('❌ Error loading appointments:', err); }
  };
  const loadMessages = async (appointmentId) => {
    try { 
      const res = await api.get(`/api/messages/${appointmentId}`); 
      setChatMessages(res.data.messages || []);
      console.log('✅ Messages for appointment', appointmentId, ':', res.data.messages);
    }
    catch (err) { console.error('❌ Error loading messages:', err); }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedAppt || sendingMessage) return;
    
    setSendingMessage(true);
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
      // Send message via HTTP to save to database
      const res = await api.post('/api/messages', { 
        appointment_id: selectedAppt.id, 
        content: chatInput.trim()
      });
      
      const messageId = res.data.message_id;
      
      // Clear input immediately
      setChatInput('');
      
      // Broadcast via WebSocket to real-time connected users
      if (socketRef.current && messageId) {
        socketRef.current.emit('send_message', {
          appointmentId: selectedAppt.id,
          content: chatInput.trim(),
          messageId: messageId,
          sender_id: user.id
        });
      }
      
      // Reload messages to display latest
      await loadMessages(selectedAppt.id);
      
    } catch (err) { 
      console.error('Lỗi gửi tin nhắn:', err);
      alert('Lỗi gửi tin nhắn'); 
    } finally {
      setSendingMessage(false);
    }
  };
  // ALL useEffect BEFORE conditional return
  useEffect(() => { loadCounselors(); loadMyAppointments(); }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('✅✅✅ [SOCKET] Connected to WebSocket, ID:', socket.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('❌ [SOCKET] Disconnected! Reason:', reason);
    });
    
    socket.on('reconnect_attempt', () => {
      console.log('🔄 [SOCKET] Attempting to reconnect...');
    });
    
    socket.on('reconnect', () => {
      console.log('✅ [SOCKET] Reconnected!');
      if (selectedApptRef.current) {
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('🎯 [SOCKET] Re-joining appointment', selectedApptRef.current.id);
        socket.emit('join_appointment', {
          appointmentId: selectedApptRef.current.id,
          userId: user?.id
        });
      }
    });
    
    // Define handler function OUTSIDE listener to ensure proper cleanup
    const handleReceiveMessage = (data) => {
      console.log('📨 [SOCKET] Nhận tin nhắn từ socket:', data);
      console.log('📍 [SOCKET] Appointment ID từ socket:', data.appointmentId);
      console.log('📍 [SOCKET] Current appointment ID:', selectedApptRef.current?.id);
      
      if (data.appointmentId === selectedApptRef.current?.id) {
        console.log('✅ [SOCKET] Tin nhắn thuộc cuộc hẹn hiện tại, thêm vào chat');
        setChatMessages(prev => {
          const exists = prev.some(m => m.id === data.id);
          if (exists) {
            console.log('⚠️ [SOCKET] Tin nhắn đã tồn tại:', data.id);
            return prev;
          }
          
          return [...prev, {
            id: data.id || Date.now(),
            appointment_id: data.appointmentId,
            sender_id: data.sender_id,
            content: data.content,
            sender_role: data.sender_role || 'unknown',
            sender_name: data.sender_name || 'User',
            created_at: data.created_at || new Date().toISOString()
          }];
        });
      } else {
        console.log('ℹ️ [SOCKET] Tin nhắn thuộc appointment khác:', data.appointmentId);
      }
    };
    
    // Đặt listener với handler function
    socket.on('receive_message', handleReceiveMessage);
    
    socket.on('error', (error) => {
      console.error('❌ [SOCKET] WebSocket error:', error);
    });
    
    // Cleanup ĐÚNG: Off listener bằng handler function, KHÔNG disconnect socket
    return () => {
      console.log('🧹 [SOCKET] Cleanup receive_message listener');
      socket.off('receive_message', handleReceiveMessage);
    };
  }, []);

  // Keep selectedApptRef in sync with selectedAppt state
  useEffect(() => {
    selectedApptRef.current = selectedAppt;
    console.log('Updated selectedApptRef to:', selectedAppt?.id);
  }, [selectedAppt]);

  // Join appointment room and load messages when appointment is selected
  useEffect(() => {
    if (!selectedAppt || !socketRef.current) return;
    
    console.log('🎯 [JOIN] Joining appointment:', selectedAppt.id);
    
    // Clear old messages
    setChatMessages([]);
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Join appointment room
    socketRef.current.emit('join_appointment', {
      appointmentId: selectedAppt.id,
      userId: user?.id
    });
    console.log('✅ [JOIN] Emitted join_appointment event');
    
    // Load existing messages immediately
    loadMessages(selectedAppt.id);
    
    // Setup polling every 3 seconds as fallback for real-time updates
    const pollInterval = setInterval(() => {
      console.log('🔄 [POLL] Polling messages for appointment', selectedAppt.id);
      loadMessages(selectedAppt.id);
    }, 3000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [selectedAppt]);

  useEffect(() => {
    if (messageEndRef.current) messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Role check - conditional RENDER after all hooks
  if (userRole !== 'student') {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ color: '#999' }}>❌ Trang này chỉ dành cho học sinh</h3>
        <p style={{ color: '#999' }}>Vai trò của bạn: 👩‍⚕️ Nhà tham vấn</p>
      </div>
    );
  }

  const handleBookAppointment = async () => {
    if (!selectedCounselor || !appointmentDate || !appointmentTime) {
      return alert('Vui lòng điền đầy đủ thông tin');
    }
    setLoading(true);
    try {
      await api.post('/api/appointments', {
        counselor_id: selectedCounselor.id,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        note: notes || null
      });
      alert('✅ Đặt lịch thành công!');
      setSelectedCounselor(null);
      setAppointmentDate('');
      setAppointmentTime('');
      setNotes('');
      loadMyAppointments();
    } catch (err) {
      alert('❌ Lỗi: ' + (err.response?.data?.error || 'Không thể đặt lịch'));
    }
    setLoading(false);
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Bạn chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await api.delete(`/api/appointments/${appointmentId}`);
      loadMyAppointments();
    } catch (err) {
      alert('❌ Lỗi: ' + (err.response?.data?.error || 'Không thể hủy lịch'));
    }
  };

  return (
    <div className="page appointments-page">
      <div className="page-header">
        <h2>Đặt lịch tư vấn</h2>
        <p>Tìm kiếm và đặt lịch hẹn với nhà tư vấn tâm lý</p>
      </div>

      <div className="tab-row" style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #f0f0f0' }}>
        <button 
          onClick={() => setTab('book')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'book' ? '3px solid #667eea' : 'none',
            color: tab === 'book' ? '#667eea' : '#999',
            fontSize: '14px',
            fontWeight: tab === 'book' ? '600' : '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Đặt lịch mới
        </button>
        <button 
          onClick={() => setTab('my')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'my' ? '3px solid #667eea' : 'none',
            color: tab === 'my' ? '#667eea' : '#999',
            fontSize: '14px',
            fontWeight: tab === 'my' ? '600' : '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          Lịch của tôi
          {myAppointments.length > 0 && (
            <span style={{
              background: '#667eea',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: '600',
              marginLeft: '6px'
            }}>
              {myAppointments.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'book' ? (
        <div className="booking-section" style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
          <div style={{ flex: '1', minWidth: 0 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Danh sách nhà tư vấn</h3>
            {counselors.length === 0 ? (
              <p className="empty-state">Chưa có nhà tư vấn nào</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {counselors.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedCounselor(c)}
                    style={{
                      padding: '14px',
                      border: selectedCounselor?.id === c.id ? '2px solid #667eea' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: selectedCounselor?.id === c.id ? '#f8f9ff' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: selectedCounselor?.id === c.id ? '0 2px 8px rgba(102, 126, 234, 0.1)' : 'none'
                    }}
                    onMouseOver={e => !selectedCounselor?.id === c.id && (e.currentTarget.style.background = '#f9f9f9')}
                    onMouseOut={e => !selectedCounselor?.id === c.id && (e.currentTarget.style.background = '#fff')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600' }}>
                          {c.full_name || c.username}
                        </h4>
                        {c.specialty && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#667eea', fontWeight: '500' }}>
                            {c.specialty}
                          </p>
                        )}
                      </div>
                      {selectedCounselor?.id === c.id && (
                        <div style={{ fontSize: '18px' }}>✓</div>
                      )}
                    </div>
                    {c.experience_years > 0 && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999' }}>
                        {c.experience_years} năm kinh nghiệm
                      </p>
                    )}
                    {c.bio && (
                      <p style={{ margin: '0', fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                        {c.bio.substring(0, 100)}...
                      </p>
                    )}
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      {c.is_available ? (
                        <span style={{ color: '#4CAF50', fontWeight: '500' }}>● Sẵn sàng nhận lịch</span>
                      ) : (
                        <span style={{ color: '#999', fontWeight: '500' }}>● Tạm dừng</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedCounselor && (
            <div style={{ flex: '0 0 320px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', height: 'fit-content', position: 'sticky', top: '60px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Chi tiết lịch hẹn</h3>
              
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9ff', borderRadius: '6px', borderLeft: '3px solid #667eea' }}>
                <p style={{ margin: '0', fontSize: '13px', fontWeight: '500', color: '#333' }}>
                  Tư vấn viên: <strong>{selectedCounselor.full_name || selectedCounselor.username}</strong>
                </p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
                  Ngày hẹn
                </label>
                <input 
                  type="date" 
                  value={appointmentDate} 
                  onChange={e => setAppointmentDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
                  Giờ hẹn
                </label>
                <input 
                  type="time" 
                  value={appointmentTime} 
                  onChange={e => setAppointmentTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
                  Ghi chú (tùy chọn)
                </label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Nội dung bạn muốn bàn luận..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button 
                onClick={handleBookAppointment} 
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: loading ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => !loading && (e.target.style.background = '#5568d3')}
                onMouseOut={e => !loading && (e.target.style.background = '#667eea')}
              >
                {loading ? '⏳ Đang xử lý...' : 'Đặt lịch'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="my-appointments" style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 180px)', marginTop: '50px' }}>
          <div style={{ flex: '0 0 30%', overflowY: 'auto', borderRight: '1px solid #eee', paddingRight: '12px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Lịch hẹn của tôi</h3>
            {myAppointments.length === 0 ? (
              <div className="empty-state">Bạn chưa có lịch hẹn nào</div>
            ) : (
              myAppointments.map(apt => {
                const statusConfig = {
                  pending: { label: 'Chờ xác nhận', color: '#FFA500', bg: '#FFF8E7' },
                  confirmed: { label: 'Đã xác nhận', color: '#4CAF50', bg: '#F0FAF2' },
                  completed: { label: 'Hoàn tất', color: '#2196F3', bg: '#E3F2FD' },
                  cancelled: { label: 'Đã hủy', color: '#f44336', bg: '#FFEBEE' }
                };
                const statusInfo = statusConfig[apt.status] || statusConfig.pending;
                const isClickable = apt.status === 'confirmed' || apt.status === 'completed';
                
                return (
                  <div 
                    key={apt.id} 
                    className="appointment-item"
                    onClick={() => isClickable && setSelectedAppt(apt)}
                    style={{
                      padding: '12px',
                      marginBottom: '12px',
                      borderRadius: '8px',
                      border: selectedAppt?.id === apt.id ? '2px solid #667eea' : '1px solid #eee',
                      background: selectedAppt?.id === apt.id ? '#f8f9ff' : '#fff',
                      boxShadow: selectedAppt?.id === apt.id ? '0 2px 8px rgba(102, 126, 234, 0.1)' : 'none',
                      cursor: isClickable ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>
                        {apt.counselor_name || 'Nhà tư vấn'}
                      </h4>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: statusInfo.bg,
                        color: statusInfo.color
                      }}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0', fontSize: '12px', color: '#666' }}>
                      {apt.appointment_date} · {apt.appointment_time?.slice(0, 5)}
                    </p>
                    {apt.note && (
                      <p style={{ margin: '6px 0', fontSize: '12px', color: '#999', fontStyle: 'italic', maxHeight: '40px', overflow: 'hidden' }}>
                        "{apt.note}"
                      </p>
                    )}
                    {isClickable && (
                      <p style={{ fontSize: '12px', color: '#667eea', fontWeight: '500', marginTop: '8px', marginBottom: '0' }}>
                        ▶ Nhấn để bắt đầu chat
                      </p>
                    )}
                    {apt.status === 'pending' && (
                      <button 
                        className="cancel-btn" 
                        onClick={(e) => { e.stopPropagation(); handleCancelAppointment(apt.id); }}
                        style={{ width: '100%', marginTop: '8px', padding: '6px', fontSize: '12px' }}
                      >
                        Hủy lịch
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {selectedAppt && (selectedAppt.status === 'confirmed' || selectedAppt.status === 'completed') && (
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                  Trao đổi với {selectedAppt.counselor_name}
                </h3>
                <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                  {selectedAppt.appointment_date} · {selectedAppt.appointment_time?.slice(0, 5)}
                </p>
              </div>

              <div style={{ flex: '1', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>Chưa có tin nhắn</p>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Hãy bắt đầu cuộc trò chuyện</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => {
                    const isSentByMe = msg.sender_role === 'student';
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: isSentByMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%',
                          background: isSentByMe ? '#667eea' : '#f0f0f0',
                          color: isSentByMe ? 'white' : '#333',
                          padding: '10px 12px',
                          borderRadius: isSentByMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                          wordWrap: 'break-word'
                        }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '14px', lineHeight: '1.4' }}>
                            {msg.content}
                          </p>
                          <p style={{ fontSize: '10px', opacity: 0.7, margin: '0', marginTop: '4px' }}>
                            {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && !sendingMessage && sendMessage()}
                  placeholder="Nhập tin nhắn..."
                  disabled={sendingMessage}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '20px',
                    border: '1px solid #ddd',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    opacity: sendingMessage ? 0.6 : 1
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage || !chatInput.trim()}
                  style={{
                    padding: '10px 16px',
                    background: sendingMessage || !chatInput.trim() ? '#ccc' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: sendingMessage || !chatInput.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={e => e.target.style.background = '#5568d3'}
                  onMouseOut={e => e.target.style.background = '#667eea'}
                >
                  Gửi
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
