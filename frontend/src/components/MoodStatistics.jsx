
import React, { useMemo } from 'react';
import '../styles/MoodStatistics.css';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StarIcon from '@mui/icons-material/Star';
import BarChartIcon from '@mui/icons-material/BarChart';
import NoteAltIcon from '@mui/icons-material/NoteAlt';

const MOOD_LABELS = {
  1: { icon: <SentimentVeryDissatisfiedIcon style={{ color: '#FF6B6B' }} />, label: 'Rất tệ' },
  2: { icon: <SentimentDissatisfiedIcon style={{ color: '#FFA500' }} />, label: 'Tệ' },
  3: { icon: <SentimentNeutralIcon style={{ color: '#FFD700' }} />, label: 'Bình thường' },
  4: { icon: <SentimentSatisfiedAltIcon style={{ color: '#90EE90' }} />, label: 'Tốt' },
  5: { icon: <SentimentVerySatisfiedIcon style={{ color: '#4CAF50' }} />, label: 'Rất tốt' },
};

const MOOD_COLORS = {
  1: '#FF6B6B',
  2: '#FFA500',
  3: '#FFD700',
  4: '#90EE90',
  5: '#4CAF50'
};

export default function MoodStatistics({ diaries = [], year, month }) {
  // Tính toán thống kê từ diaries
  const stats = useMemo(() => {
    if (!diaries.length) {
      return {
        totalDiaries: 0,
        totalDays: 0,
        averageMood: 0,
        moodDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalDiaries = diaries.length;
    const dailyMoods = {};
    let totalScore = 0;

    // Group nhật ký theo ngày và lấy mood_score gần nhất
    diaries.forEach(diary => {
      const dateStr = new Date(diary.created_at).toLocaleDateString('en-CA');
      if (diary.mood_score) {
        // Lấy mood của nhật ký MỚI NHẤT trong ngày (diaries đã sort DESC)
        if (!dailyMoods[dateStr]) {
          dailyMoods[dateStr] = diary.mood_score;
        }
      }
    });

    const totalDays = Object.keys(dailyMoods).length;
    const moodDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Đếm số ngày theo từng mức mood
    Object.values(dailyMoods).forEach(mood => {
      if (mood >= 1 && mood <= 5) {
        moodDistribution[mood]++;
        totalScore += mood;
      }
    });

    const averageMood = totalDays > 0 ? totalScore / totalDays : 0;

    return {
      totalDiaries,
      totalDays,
      averageMood,
      moodDistribution
    };
  }, [diaries]);

  const monthName = new Date(year, month - 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const totalDays = stats.totalDays || 0;

  // Tính phần trăm
  const moodPercentages = {
    1: totalDays > 0 ? ((stats.moodDistribution[1] / totalDays) * 100).toFixed(1) : 0,
    2: totalDays > 0 ? ((stats.moodDistribution[2] / totalDays) * 100).toFixed(1) : 0,
    3: totalDays > 0 ? ((stats.moodDistribution[3] / totalDays) * 100).toFixed(1) : 0,
    4: totalDays > 0 ? ((stats.moodDistribution[4] / totalDays) * 100).toFixed(1) : 0,
    5: totalDays > 0 ? ((stats.moodDistribution[5] / totalDays) * 100).toFixed(1) : 0,
  };

  return (
    <div className="mood-statistics-container">
      <div className="stats-header">
        <h3><BarChartIcon style={{verticalAlign:'middle',marginRight:6}}/>Thống Kê Cảm Xúc</h3>
        <span className="stats-period">{monthName}</span>
      </div>

      {totalDays === 0 ? (
        <div className="stats-empty">
          <p><NoteAltIcon style={{verticalAlign:'middle',marginRight:4}}/>Chưa có dữ liệu trong tháng này</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-summary">
            <div className="stat-card">
              <div className="stat-number">{stats.totalDiaries}</div>
              <div className="stat-label"><MenuBookIcon fontSize="small" style={{verticalAlign:'middle',marginRight:2}}/>Nhật ký</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{totalDays}</div>
              <div className="stat-label"><CalendarMonthIcon fontSize="small" style={{verticalAlign:'middle',marginRight:2}}/>Ngày ghi</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.averageMood.toFixed(1)}</div>
              <div className="stat-label"><StarIcon fontSize="small" style={{verticalAlign:'middle',marginRight:2}}/>Trung bình</div>
            </div>
          </div>

          {/* Mood Distribution Bar Chart */}
          <div className="stats-distribution">
            <h4>Phân bố cảm xúc</h4>
            <div className="distribution-list">
              {[1, 2, 3, 4, 5].map(score => (
                <div key={score} className="distribution-item">
                  <div className="dist-label" style={{display:'flex',alignItems:'center',gap:6}}>
                    {MOOD_LABELS[score].icon}
                    <span>{MOOD_LABELS[score].label}</span>
                  </div>
                  <div className="dist-bar-container">
                    <div 
                      className="dist-bar"
                      style={{
                        width: `${moodPercentages[score]}%`,
                        backgroundColor: MOOD_COLORS[score]
                      }}
                    ></div>
                  </div>
                  <div className="dist-stats">
                    <span>{stats.moodDistribution[score]}</span>
                    <span className="percentage">({moodPercentages[score]}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mood Breakdown */}
          <div className="stats-breakdown">
            <h4>Chi tiết theo mức độ</h4>
            <div className="breakdown-grid">
              {[1, 2, 3, 4, 5].map(score => (
                <div key={score} className="breakdown-card" style={{ borderLeftColor: MOOD_COLORS[score] }}>
                  <div className="breakdown-emoji" style={{ backgroundColor: MOOD_COLORS[score] + '20', display:'flex',alignItems:'center',justifyContent:'center' }}>
                    {MOOD_LABELS[score].icon}
                  </div>
                  <div className="breakdown-info">
                    <div className="breakdown-title">{MOOD_LABELS[score].label}</div>
                    <div className="breakdown-count">{stats.moodDistribution[score]} ngày</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
