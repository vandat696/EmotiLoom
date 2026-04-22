import React, { useState, useEffect, useRef } from 'react';
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

export default function ManagementPage({ userRole, user }) {
  // Setup all hooks BEFORE conditionals
  const [tab, setTab] = useState('requests');
  const [appointments, setAppointments] = useState([]);
  const socketRef = useRef(null);
  const selectedApptRef = useRef(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [profile, setProfile] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const bottomRef = useRef(null);

  // Define async functions BEFORE useEffect
  const loadAppointments = async () => {
    try { const res = await api.get('/api/appointments'); setAppointments(res.data.appointments || []); }
    catch (err) { console.error(err); }
  };

  const loadMessages = async (appointmentId) => {
    try { const res = await api.get(`/api/messages/${appointmentId}`); setChatMessages(res.data.messages || []); }
    catch (err) { console.error(err); }
  };

  const updateStatus = async (appointmentId, status) => {
    try { 
      await api.put(`/api/appointments/${appointmentId}/status`, { status }); 
      loadAppointments();
      // Auto-switch to appointments tab khi xác nhận
      if (status === 'confirmed') {
        setTimeout(() => setTab('appointments'), 500);
      }
    }
    catch (err) { alert('❌ Lỗi: ' + err.response?.data?.error); }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedAppt || sendingMessage) return;
    
    setSendingMessage(true);
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
      // Send message via HTTP to save to database
      const res = await api.post(`/api/messages`, { 
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
          sender_id: user?.id
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
  useEffect(() => { loadAppointments(); }, []);
  
  // Reload when switching to appointments tab
  useEffect(() => {
    if (tab === 'appointments') {
      loadAppointments();
    }
  }, [tab]);

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
            sender_name: data.sender_name || 'Student',
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

  // Join appointment room when selected
  useEffect(() => {
    if (!selectedAppt || !socketRef.current) return;
    
    console.log('🎯 [JOIN] Joining appointment:', selectedAppt.id);
    
    // Clear old messages
    setChatMessages([]);
    
    const user = JSON.parse(localStorage.getItem('user'));
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
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Role check - conditional RENDER after all hooks
  if (userRole !== 'counselor') {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ color: '#f44336', fontSize: '18px', fontWeight: '600' }}>Truy cập bị từ chối</h3>
        <p style={{ color: '#999' }}>Trang này chỉ dành cho nhà tư vấn</p>
      </div>
    );
  }

  const saveProfile = () => {
    setProfileSaving(true);
    setTimeout(() => { setProfileSaving(false); alert('Lưu hồ sơ thành công!'); }, 1000);
  };

  const pendingAppts = appointments.filter(a => a.status === 'pending');
  const confirmedAppts = appointments.filter(a => a.status === 'confirmed' || a.status === 'completed');
  
  const statusConfig = {
    pending: { label: 'Chờ xác nhận', color: '#FFA500', bg: '#FFF8E7' },
    confirmed: { label: 'Đã xác nhận', color: '#4CAF50', bg: '#F0FAF2' },
    completed: { label: 'Hoàn tất', color: '#2196F3', bg: '#E3F2FD' },
    cancelled: { label: 'Đã hủy', color: '#f44336', bg: '#FFEBEE' }
  };

  return (
    <div className="page management-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '20px', padding: '12px 16px 0' }}>
        <button onClick={() => setTab('requests')} style={{
          borderBottom: tab === 'requests' ? '3px solid #667eea' : 'none',
          color: tab === 'requests' ? '#667eea' : '#999',
          fontSize: '14px',
          fontWeight: tab === 'requests' ? '600' : '500',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          paddingBottom: '12px',
          transition: 'all 0.2s'
        }}>
          Yêu cầu {pendingAppts.length > 0 && <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#667eea',
            color: 'white',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            fontSize: '11px',
            fontWeight: 'bold',
            marginLeft: '8px'
          }}>{pendingAppts.length}</span>}
        </button>
        
        <button onClick={() => { setTab('appointments'); setSelectedAppt(null); }} style={{
          borderBottom: tab === 'appointments' ? '3px solid #667eea' : 'none',
          color: tab === 'appointments' ? '#667eea' : '#999',
          fontSize: '14px',
          fontWeight: tab === 'appointments' ? '600' : '500',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          paddingBottom: '12px',
          transition: 'all 0.2s'
        }}>
          Lịch hẹn ({confirmedAppts.length})
        </button>
        
        <button onClick={() => setTab('profile')} style={{
          borderBottom: tab === 'profile' ? '3px solid #667eea' : 'none',
          color: tab === 'profile' ? '#667eea' : '#999',
          fontSize: '14px',
          fontWeight: tab === 'profile' ? '600' : '500',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          paddingBottom: '12px',
          transition: 'all 0.2s'
        }}>
          Hồ sơ
        </button>
      </div>

      {tab === 'requests' ? (
        <div style={{ width: '100%', flex: '1', overflowY: 'auto' }}>
          {pendingAppts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: '#999',
              fontSize: '14px'
            }}>
              Không có yêu cầu nào đang chờ
            </div>
          ) : (
            pendingAppts.map(a => (
              <div key={a.id} style={{
                background: 'white',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}>
                <div style={{ flex: '1' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', color: '#333' }}>
                    {a.student_username}
                  </h4>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
                    {a.appointment_date} lúc {a.appointment_time?.slice(0,5)}
                  </p>
                  {a.note && <p style={{ margin: '4px 0', fontSize: '13px', color: '#999', fontStyle: 'italic' }}>
                    Ghi chú: {a.note}
                  </p>}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button onClick={() => updateStatus(a.id, 'confirmed')} style={{
                    padding: '6px 12px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }} onMouseOver={e => e.target.style.background = '#45a049'} 
                  onMouseOut={e => e.target.style.background = '#4CAF50'}>
                    Xác nhận
                  </button>
                  <button onClick={() => updateStatus(a.id, 'cancelled')} style={{
                    padding: '6px 12px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }} onMouseOver={e => e.target.style.background = '#d32f2f'} 
                  onMouseOut={e => e.target.style.background = '#f44336'}>
                    Hủy
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : tab === 'appointments' ? (
        <>
          <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 140px)' }}>
            <div style={{ flex: '0 0 35%', overflowY: 'auto', paddingRight: '12px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: '600', color: '#333' }}>Lịch hẹn của tôi</h3>
              {confirmedAppts.length === 0 ? (
                <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                  Không có lịch hẹn nào
                </p>
              ) : (
                confirmedAppts.map(apt => (
                  <div key={apt.id} onClick={() => setSelectedAppt(apt)} style={{
                    background: selectedAppt?.id === apt.id ? '#f0f8f0' : 'white',
                    border: selectedAppt?.id === apt.id ? '2px solid #4CAF50' : '1px solid #eee',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }} onMouseOver={e => {
                    if (selectedAppt?.id !== apt.id) {
                      e.currentTarget.style.background = '#f5f5f5';
                      e.currentTarget.style.borderColor = '#ddd';
                    }
                  }} onMouseOut={e => {
                    if (selectedAppt?.id !== apt.id) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#eee';
                    }
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        {apt.student_username}
                      </h4>
                      <span style={{
                        background: statusConfig[apt.status].bg,
                        color: statusConfig[apt.status].color,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {statusConfig[apt.status].label}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                      {apt.appointment_date} {apt.appointment_time?.slice(0,5)}
                    </p>
                  </div>
                ))
              )}
            </div>

            {selectedAppt && (
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', background: '#f9f9f9', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #ddd' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#333' }}>
                      {selectedAppt.student_username}
                    </h3>
                    <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                      {selectedAppt.appointment_date} lúc {selectedAppt.appointment_time?.slice(0,5)}
                    </p>
                  </div>
                  {selectedAppt.status === 'confirmed' && (
                    <button onClick={() => updateStatus(selectedAppt.id, 'completed')} style={{
                      padding: '6px 12px',
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>Hoàn tất</button>
                  )}
                </div>

                <div style={{ flex: '1', overflowY: 'auto', background: 'white', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: msg.sender_role === 'counselor' ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        background: msg.sender_role === 'counselor' ? '#667eea' : '#ddd',
                        color: msg.sender_role === 'counselor' ? 'white' : '#333',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        maxWidth: '70%',
                        wordWrap: 'break-word'
                      }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>{msg.content}</p>
                        <p style={{ margin: '0', fontSize: '11px', opacity: 0.7 }}>
                          {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && !sendingMessage && sendMessage()} 
                    placeholder="Nhập tin nhắn..."
                    disabled={sendingMessage}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '20px',
                      fontSize: '13px',
                      opacity: sendingMessage ? 0.6 : 1
                    }} />
                  <button onClick={sendMessage} disabled={sendingMessage || !chatInput.trim()} style={{
                    padding: '8px 16px',
                    background: sendingMessage || !chatInput.trim() ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: sendingMessage || !chatInput.trim() ? 'not-allowed' : 'pointer'
                  }}>Gửi</button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ flex: '1', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '20px' }}>Hồ sơ chuyên gia</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              Chuyên môn
            </label>
            <input type="text" defaultValue={profile.specialization || ''} 
              onChange={e => setProfile({ ...profile, specialization: e.target.value })} 
              placeholder="VD: Tâm lý học, Tư vấn học" 
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }} />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              Giới thiệu
            </label>
            <textarea defaultValue={profile.bio || ''} 
              onChange={e => setProfile({ ...profile, bio: e.target.value })} 
              placeholder="Viết về kinh nghiệm và chuyên môn của bạn" 
              rows={6}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical'
              }} />
          </div>
          
          <button onClick={saveProfile} disabled={profileSaving} style={{
            padding: '10px 16px',
            background: profileSaving ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: profileSaving ? 'not-allowed' : 'pointer',
            width: '100%'
          }}>
            {profileSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </button>
        </div>
      )}
    </div>
  );
}
