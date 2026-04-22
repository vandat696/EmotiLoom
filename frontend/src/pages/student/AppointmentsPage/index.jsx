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
			const res = await api.post('/api/messages', { 
				appointment_id: selectedAppt.id, 
				content: chatInput.trim()
			});
			
			const messageId = res.data.message_id;
			
			setChatInput('');
			
			if (socketRef.current && messageId) {
				socketRef.current.emit('send_message', {
					appointmentId: selectedAppt.id,
					content: chatInput.trim(),
					messageId: messageId,
					sender_id: user.id
				});
			}
			
			await loadMessages(selectedAppt.id);
			
		} catch (err) { 
			console.error('Lỗi gửi tin nhắn:', err);
			alert('Lỗi gửi tin nhắn'); 
		} finally {
			setSendingMessage(false);
		}
	};

	useEffect(() => { loadCounselors(); loadMyAppointments(); }, []);

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
		
		socket.on('receive_message', handleReceiveMessage);
		
		socket.on('error', (error) => {
			console.error('❌ [SOCKET] WebSocket error:', error);
		});
		
		return () => {
			console.log('🧹 [SOCKET] Cleanup receive_message listener');
			socket.off('receive_message', handleReceiveMessage);
		};
	}, []);

	useEffect(() => {
		selectedApptRef.current = selectedAppt;
		console.log('Updated selectedApptRef to:', selectedAppt?.id);
	}, [selectedAppt]);

	useEffect(() => {
		if (!selectedAppt || !socketRef.current) return;
		
		console.log('🎯 [JOIN] Joining appointment:', selectedAppt.id);
		
		setChatMessages([]);
		
		const user = JSON.parse(localStorage.getItem('user'));
		
		socketRef.current.emit('join_appointment', {
			appointmentId: selectedAppt.id,
			userId: user?.id
		});
		console.log('✅ [JOIN] Emitted join_appointment event');
		
		loadMessages(selectedAppt.id);
	}, [selectedAppt]);

	return (
		<div className="page appointments-page" style={{ display: 'flex', gap: 20 }}>
			<div style={{ width: 360 }}>
				<h3>Đặt lịch</h3>
				<div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 12 }}>
					<label>Chọn nhà tham vấn</label>
					<select value={selectedCounselor?.id || ''} onChange={e => setSelectedCounselor(counselors.find(c => String(c.id) === e.target.value) || null)} style={{ width: '100%', padding: 8, marginTop: 6 }}>
						<option value="">-- Chọn --</option>
						{counselors.map(c => (<option key={c.id} value={c.id}>{c.name || c.username}</option>))}
					</select>
					<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
						<input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} style={{ flex: 1 }} />
						<input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} style={{ width: 120 }} />
					</div>
					<textarea placeholder="Ghi chú (tùy chọn)" value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', marginTop: 8, minHeight: 80 }} />
					<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
						<button disabled={!selectedCounselor || !appointmentDate || !appointmentTime || loading} onClick={async () => {
							setLoading(true);
							try {
								await api.post('/api/appointments', { counselor_id: selectedCounselor.id, date: appointmentDate, time: appointmentTime, notes });
								setAppointmentDate(''); setAppointmentTime(''); setNotes(''); setSelectedCounselor(null);
								await loadMyAppointments();
								alert('Đặt lịch thành công');
							} catch (err) { console.error(err); alert('Lỗi đặt lịch'); }
							setLoading(false);
						}}>{loading ? 'Đang...' : 'Đặt lịch'}</button>
					</div>
				</div>

				<h4>Nhà tham vấn</h4>
				<div style={{ border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
					{counselors.length === 0 ? <div className="empty-state">Không có nhà tham vấn</div> : counselors.map(c => (
						<div key={c.id} style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<strong>{c.name || c.username}</strong>
								<span style={{ color: '#666' }}>{c.specialty || ''}</span>
							</div>
							<div style={{ color: '#666', fontSize: 13 }}>{c.bio || ''}</div>
						</div>
					))}
				</div>
			</div>

			<div style={{ flex: 1 }}>
				<h3>Cuộc hẹn của tôi</h3>
				<div style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, minHeight: 120 }}>
					{myAppointments.length === 0 ? <div className="empty-state">Bạn chưa có cuộc hẹn</div> : myAppointments.map(a => (
						<div key={a.id} style={{ padding: 12, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: selectedAppt?.id === a.id ? '#f7f9ff' : 'transparent' }} onClick={() => setSelectedAppt(a)}>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<div>
									<strong>{a.counselor_name || a.counselor || 'Nhà tham vấn'}</strong>
									<div style={{ color: '#666', fontSize: 13 }}>{new Date(a.scheduled_at || `${a.date}T${a.time}`).toLocaleString()}</div>
								</div>
								<div style={{ textAlign: 'right' }}>
									<div style={{ fontSize: 13, color: '#666' }}>{a.status}</div>
								</div>
							</div>
							<div style={{ marginTop: 8 }}>{a.notes}</div>
						</div>
					))}
				</div>

				<div style={{ marginTop: 12 }}>
					{selectedAppt ? (
						<div style={{ border: '1px solid #eee', borderRadius: 8, display: 'flex', flexDirection: 'column', height: '60vh' }}>
							<div style={{ padding: 12, borderBottom: '1px solid #eee' }}>
								<strong>Chat với {selectedAppt.counselor_name || 'Nhà tham vấn'}</strong>
							</div>
							<div style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
								{chatMessages.length === 0 ? <div className="empty-state">Chưa có tin nhắn</div> : chatMessages.map(m => (
									<div key={m.id} style={{ marginBottom: 8 }}>
										<div style={{ fontSize: 13, color: '#333' }}><strong>{m.sender_name || (m.sender_role === 'counselor' ? 'Nhà tham vấn' : 'Bạn')}</strong> <span style={{ color: '#999', fontSize: 12 }}>· {new Date(m.created_at).toLocaleString()}</span></div>
										<div style={{ marginTop: 4 }}>{m.content}</div>
									</div>
								))}
							</div>
							<div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
								<input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Gửi tin nhắn..." style={{ flex: 1 }} />
								<button onClick={sendMessage} disabled={sendingMessage || !chatInput.trim()}>Gửi</button>
							</div>
						</div>
					) : (
						<div style={{ padding: 20, color: '#666' }}>Chọn một cuộc hẹn để chat.</div>
					)}
				</div>
			</div>
		</div>
	);
}
