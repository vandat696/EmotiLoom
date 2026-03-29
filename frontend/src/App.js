import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// Pages
import AuthPage from './pages/auth/AuthPage';
import HomePage from './pages/shared/HomePage';
import DiaryPage from './pages/student/DiaryPage';
import AppointmentsPage from './pages/student/AppointmentsPage';
import AIChatPage from './pages/shared/AIChatPage';
import CommunityPage from './pages/shared/CommunityPage';
import ManagementPage from './pages/counselor/ManagementPage';
import AdminDashboard from './pages/admin/AdminDashboard';

// Utils
import { Icon, Icons } from './pages/constants';

const API = process.env.REACT_APP_API_URL;
const api = axios.create({ baseURL: API });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(() => { 
    try { return JSON.parse(localStorage.getItem('user')); } 
    catch { return null; } 
  });
  const [userRole, setUserRole] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.role || 'student';
    } catch {
      return 'student';
    }
  });
  const [page, setPage] = useState('home');

  const handleLogin = (u) => { 
    setUser(u); 
    setUserRole(u?.role || 'student');
    setIsLoggedIn(true); 
  };
  
  const handleLogout = () => { 
    localStorage.clear(); 
    setIsLoggedIn(false); 
    setUser(null); 
    setUserRole('student');
  };

  if (!isLoggedIn) return <AuthPage onLogin={handleLogin} />;

  const isCounselor = userRole === 'counselor';
  const isAdmin = userRole === 'admin';
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
  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.home },
    { id: 'community', label: 'Cộng đồng', icon: Icons.community },
  ];
  const navItems = isAdmin ? adminNav : (isCounselor ? counselorNav : studentNav);

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage user={user} userRole={userRole} onNavigate={setPage} />;
      case 'diary': return <DiaryPage userRole={userRole} />;
      case 'ai': return <AIChatPage />;
      case 'counselor': return <AppointmentsPage user={user} userRole={userRole} />;
      case 'counseling': return <ManagementPage user={user} userRole={userRole} />;
      case 'dashboard': return <AdminDashboard userRole={userRole} />;
      case 'community': return <CommunityPage user={user} />;
      default: return isAdmin ? <AdminDashboard userRole={userRole} /> : <HomePage user={user} userRole={userRole} onNavigate={setPage} />;
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo"><span>🌸</span><span>EmotiLoom</span></div>
        {isAdmin && <div className="role-badge">⚙️ Quản Trị Viên</div>}
        {isCounselor && <div className="role-badge">👩‍⚕️ Tham vấn viên</div>}
        {!isCounselor && !isAdmin && <div className="role-badge">🎓 Học sinh</div>}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
              <Icon d={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="user-avatar">{isAdmin ? '⚙️' : (isCounselor ? '👩‍⚕️' : '👤')}</span>
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
