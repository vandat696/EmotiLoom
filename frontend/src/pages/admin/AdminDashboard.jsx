import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;
const api = axios.create({ baseURL: API });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function AdminDashboard({ userRole }) {
  const [overview, setOverview] = useState(null);
  const [moodDist, setMoodDist] = useState(null);
  const [trending, setTrending] = useState(null);
  const [lowMoodStudents, setLowMoodStudents] = useState([]);
  const [sentiments, setSentiments] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [topCounselors, setTopCounselors] = useState([]);
  const [days, setDays] = useState('30');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, md, tr, lms, sent, as, tc] = await Promise.all([
        api.get('/api/admin/dashboard/overview'),
        api.get(`/api/admin/dashboard/mood-distribution?days=${days}`),
        api.get('/api/admin/dashboard/mood-trending'),
        api.get('/api/admin/dashboard/low-mood-students'),
        api.get('/api/admin/dashboard/top-sentiments'),
        api.get('/api/admin/dashboard/appointment-stats'),
        api.get('/api/admin/dashboard/top-counselors')
      ]);

      setOverview(ov.data.overview);
      setMoodDist(md.data.distribution);
      setTrending(tr.data.trending);
      setLowMoodStudents(lms.data.students || []);
      setSentiments(sent.data.sentiments || []);
      setAppointmentStats(as.data.stats);
      setTopCounselors(tc.data.counselors || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleFilterByDate = async () => {
    if (!fromDate || !toDate) return alert('Vui lòng chọn khoảng thời gian');
    
    try {
      const res = await api.get('/api/admin/dashboard/date-range', {
        params: { fromDate, toDate }
      });
      setMoodDist(res.data.moodDistribution);
      setTrending(res.data.trending);
      setSentiments(res.data.sentiments || []);
    } catch (err) {
      console.error('Error filtering by date:', err);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ color: '#f44336' }}>❌ Truy cập bị từ chối</h3>
        <p style={{ color: '#999' }}>Trang này chỉ dành cho quản trị viên</p>
      </div>
    );
  }

  if (loading) {
    return <div className="page" style={{ textAlign: 'center', padding: '40px' }}>⏳ Đang tải...</div>;
  }

  return (
    <div className="page admin-dashboard" style={{ padding: '20px' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>📊 Dashboard Quản Lý Sức Khỏe Tinh Thần</h1>

      {/* ─── OVERVIEW CARDS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <div style={{ background: '#E3F2FD', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#2196F3', fontSize: '12px', fontWeight: '600', margin: '0 0 8px' }}>👥 Học Sinh Đang Hoạt Động</p>
          <h2 style={{ color: '#1976D2', margin: '0', fontSize: '32px' }}>{overview?.activeStudents || 0}</h2>
        </div>
        <div style={{ background: '#F3E5F5', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#7B1FA2', fontSize: '12px', fontWeight: '600', margin: '0 0 8px' }}>📝 Nhật Ký (7 Ngày)</p>
          <h2 style={{ color: '#6A1B9A', margin: '0', fontSize: '32px' }}>{overview?.diariesLast7Days || 0}</h2>
        </div>
        <div style={{ background: '#E8F5E9', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#388E3C', fontSize: '12px', fontWeight: '600', margin: '0 0 8px' }}>✅ Tham Vấn (Tháng)</p>
          <h2 style={{ color: '#2E7D32', margin: '0', fontSize: '32px' }}>{overview?.appointmentsThisMonth || 0}</h2>
        </div>
      </div>

      {/* ─── MOOD DISTRIBUTION CHART ─── */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#333', margin: '0' }}>📊 Phân Bố Tâm Trạng (Mood Score)</h3>
          <select value={days} onChange={(e) => { setDays(e.target.value); loadDashboard(); }} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="7">7 ngày</option>
            <option value="30">30 ngày</option>
            <option value="90">90 ngày</option>
          </select>
        </div>
        
        {moodDist && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {[1, 2, 3, 4, 5].map(level => (
              <div key={level} style={{ textAlign: 'center', padding: '16px', background: `hsl(${(level - 1) * 60}, 70%, 85%)`, borderRadius: '8px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#333' }}>Mức {level}</p>
                <h3 style={{ margin: '0', color: '#000', fontSize: '28px' }}>{moodDist[level] || 0}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── TRENDING LINE CHART (30 DAYS) ─── */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#333', marginTop: '0' }}>📈 Xu Hướng Tâm Trạng (30 Ngày)</h3>
        {trending && trending.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#333' }}>Ngày</th>
                  <th style={{ textAlign: 'center', padding: '12px', color: '#333' }}>Tâm Trạng TB</th>
                  <th style={{ textAlign: 'center', padding: '12px', color: '#333' }}>Số Nhật Ký</th>
                </tr>
              </thead>
              <tbody>
                {trending.slice(-10).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', color: '#666' }}>{item.date}</td>
                    <td style={{ textAlign: 'center', padding: '12px', color: '#2196F3', fontWeight: '600' }}>{parseFloat(item.avg_mood).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '12px', color: '#666' }}>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── TOP SENTIMENTS ─── */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#333', marginTop: '0' }}>🏷️ Cảm Xúc Phổ Biến Nhất</h3>
        {sentiments && sentiments.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {sentiments.slice(0, 6).map((s, idx) => (
              <div key={idx} style={{ padding: '12px', background: '#F5F5F5', borderRadius: '6px', borderLeft: '4px solid #667eea' }}>
                <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#333' }}>{s.sentiment}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, height: '20px', background: '#E0E0E0', marginRight: '8px', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#667eea', width: `${s.percentage}%` }} />
                  </div>
                  <span style={{ fontWeight: '600', color: '#667eea' }}>{s.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999' }}>Chưa có dữ liệu cảm xúc</p>
        )}
      </div>

      {/* ─── APPOINTMENT STATS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '30px' }}>
        <div style={{ background: '#FFF3E0', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: '#FF9800', fontSize: '12px', fontWeight: '600', margin: '0 0 8px' }}>⏳ Chờ Xác Nhận</p>
          <h2 style={{ color: '#E65100', margin: '0', fontSize: '28px' }}>{appointmentStats?.pending || 0}</h2>
        </div>
        <div style={{ background: '#E3F2FD', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: '#2196F3', fontSize: '12px', fontWeight: '600', margin: '0 0 8px' }}>✅ Đã Xác Nhận</p>
          <h2 style={{ color: '#1565C0', margin: '0', fontSize: '28px' }}>{appointmentStats?.confirmed || 0}</h2>
        </div>
        <div style={{ background: '#E8F5E9', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: '#4CAF50', fontSize: '12px', fontWeight: '600', margin: '0 0 8px' }}>🎉 Hoàn Tất</p>
          <h2 style={{ color: '#2E7D32', margin: '0', fontSize: '28px' }}>{appointmentStats?.completed || 0}</h2>
        </div>
        <div style={{ background: '#FFEBEE', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: '#F44336', fontSize: '12px', fontWeight: '600', margin: '0 0 8px' }}>❌ Đã Hủy</p>
          <h2 style={{ color: '#C62828', margin: '0', fontSize: '28px' }}>{appointmentStats?.cancelled || 0}</h2>
        </div>
      </div>

      {/* ─── TOP COUNSELORS ─── */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#333', marginTop: '0' }}>⭐ Top 5 Nhà Tư Vấn (Hoàn Tất)</h3>
        {topCounselors && topCounselors.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#333' }}>Tên</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#333' }}>Chuyên Ngành</th>
                <th style={{ textAlign: 'center', padding: '12px', color: '#333' }}>Ca Hoàn Tất</th>
              </tr>
            </thead>
            <tbody>
              {topCounselors.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', color: '#333', fontWeight: '500' }}>{c.full_name}</td>
                  <td style={{ padding: '12px', color: '#666' }}>{c.specialty || 'N/A'}</td>
                  <td style={{ textAlign: 'center', padding: '12px', color: '#4CAF50', fontWeight: '600' }}>{c.completed_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999' }}>Chưa có dữ liệu nhà tư vấn</p>
        )}
      </div>

      {/* ─── LOW MOOD STUDENTS (ALERT) ─── */}
      <div style={{ background: '#FFEBEE', padding: '20px', borderRadius: '8px', marginBottom: '30px', borderLeft: '4px solid #F44336' }}>
        <h3 style={{ color: '#C62828', marginTop: '0' }}>⚠️ Cảnh Báo: Học Sinh Tâm Trạng Thấp (≤ 2)</h3>
        {lowMoodStudents && lowMoodStudents.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #FFCDD2' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#C62828' }}>Học Sinh</th>
                <th style={{ textAlign: 'center', padding: '12px', color: '#C62828' }}>Tâm Trạng TB (7N)</th>
                <th style={{ textAlign: 'center', padding: '12px', color: '#C62828' }}>Nhật Ký</th>
              </tr>
            </thead>
            <tbody>
              {lowMoodStudents.map((s, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #FFCDD2' }}>
                  <td style={{ padding: '12px', color: '#333' }}>{s.username}</td>
                  <td style={{ textAlign: 'center', padding: '12px', color: '#F44336', fontWeight: '600' }}>{s.avg_mood ? parseFloat(s.avg_mood).toFixed(2) : 'N/A'}</td>
                  <td style={{ textAlign: 'center', padding: '12px', color: '#666' }}>{s.diary_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#666', margin: '0' }}>✅ Không có học sinh nào có tâm trạng thấp cần cảnh báo</p>
        )}
      </div>

      {/* ─── DATE RANGE FILTER ─── */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#333', marginTop: '0' }}>📅 Lọc Theo Khoảng Thời Gian</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>Từ Ngày</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>Đến Ngày</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <button
            onClick={handleFilterByDate}
            style={{
              padding: '8px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🔍 Lọc
          </button>
        </div>
      </div>
    </div>
  );
}
