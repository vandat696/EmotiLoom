import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;
const api = axios.create({ baseURL: API });

export default function AuthPage({ onLogin }) {
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
