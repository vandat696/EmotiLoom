import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isRegisterMode, setIsRegisterMode] = useState(false); // Trạng thái chuyển đổi Đăng ký/Đăng nhập
  const [authData, setAuthData] = useState({ username: '', password: '' });
  const [diaryText, setDiaryText] = useState('');
  const [result, setResult] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;

  // Hàm xử lý chung cho cả Đăng ký và Đăng nhập
  const handleAuth = async () => {
    const endpoint = isRegisterMode ? 'register' : 'login';
    try {
      const res = await axios.post(`${API_URL}/api/auth/${endpoint}`, authData);
      
      if (isRegisterMode) {
        alert("Đăng ký thành công! Giờ cậu hãy đăng nhập nhé.");
        setIsRegisterMode(false); // Chuyển về màn hình đăng nhập
      } else {
        localStorage.setItem('token', res.data.token);
        setIsLoggedIn(true);
        alert("Chào mừng quay trở lại, " + res.data.user.username);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Có lỗi xảy ra rồi!");
    }
  };

  const handlePostDiary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/diary`, 
        { content: diaryText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data.analysis);
    } catch (err) {
      alert("Lỗi: " + err.response?.data?.error);
    }
  };

  // 1. MÀN HÌNH CHƯA ĐĂNG NHẬP (Auth)
  if (!isLoggedIn) {
    return (
      <div className="container">
        <h1>EmotiLoom 🌸</h1>
        <h2>{isRegisterMode ? "Tạo tài khoản mới" : "Đăng nhập"}</h2>
        
        <div className="auth-form">
          <input 
            type="text" 
            placeholder="Tên đăng nhập" 
            onChange={e => setAuthData({...authData, username: e.target.value})} 
          />
          <input 
            type="password" 
            placeholder="Mật khẩu" 
            onChange={e => setAuthData({...authData, password: e.target.value})} 
          />
          <button className="main-btn" onClick={handleAuth}>
            {isRegisterMode ? "Tham gia ngay" : "Vào trải nghiệm"}
          </button>
        </div>

        <p className="switch-text">
          {isRegisterMode ? "Đã có tài khoản?" : "Chưa có tài khoản?"} 
          <span onClick={() => setIsRegisterMode(!isRegisterMode)}>
            {isRegisterMode ? " Đăng nhập tại đây" : " Đăng ký ngay"}
          </span>
        </p>
      </div>
    );
  }

  // 2. MÀN HÌNH ĐÃ ĐĂNG NHẬP (Diary)
  return (
    <div className="container">
      <div className="header-row">
        <h1>Nhật ký của bạn 🌸</h1>
        <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); setIsLoggedIn(false); }}>Đăng xuất</button>
      </div>
      
      <textarea 
        value={diaryText}
        onChange={e => setDiaryText(e.target.value)} 
        placeholder="Hôm nay của cậu thế nào? Cứ tâm sự hết ở đây nhé..." 
      />
      <button className="main-btn" onClick={handlePostDiary}>Phân tích cảm xúc với AI</button>

      {result && (
        <div className="result-box">
          <div className="sentiment-tag">Cảm xúc: {result.sentiment}</div>
          <p><strong>Lời khuyên từ AI:</strong> {result.advice}</p>
        </div>
      )}
    </div>
  );
}

export default App;