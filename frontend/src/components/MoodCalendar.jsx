import React, { useState, useMemo } from 'react';
import '../styles/MoodCalendar.css';

// Định nghĩa 5 màu cho 5 mức mood
const MOOD_COLORS = {
  1: '#FF6B6B', // Rất tệ - đỏ
  2: '#FFA500', // Tệ - cam
  3: '#FFD700', // Bình thường - vàng
  4: '#90EE90', // Tốt - xanh nhạt
  5: '#4CAF50'  // Rất tốt - xanh đậm
};

const MOOD_LABELS = {
  1: '😢 Rất tệ',
  2: '😞 Tệ',
  3: '😐 Bình thường',
  4: '😊 Tốt',
  5: '😄 Rất tốt'
};

export default function MoodCalendar({ diaries = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Tính toán calendarData từ diaries
  const calendarData = useMemo(() => {
    const result = {};
    diaries.forEach(diary => {
      if (diary.mood_score) {
        const dateStr = new Date(diary.created_at).toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
        // Lấy mood của nhật ký MỚI NHẤT (since diaries được sort DESC từ backend)
        // Nếu chưa có entry cho ngày này, thêm vào
        if (!result[dateStr]) {
          result[dateStr] = diary.mood_score;
        }
      }
    });
    return result;
  }, [diaries]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m - 1, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Tạo mảng các ngày
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getMoodScore = (day) => {
    if (!day) return null;
    const dateStr = new Date(year, month - 1, day).toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
    return calendarData[dateStr] || null;
  };

  const getMoodColor = (score) => {
    return MOOD_COLORS[score] || '#E0E0E0';
  };

  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  const monthName = new Date(year, month - 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="mood-calendar-container">
      <div className="calendar-header">
        <h3>📅 Lịch Cảm Xúc</h3>
        <div className="calendar-controls">
          <button onClick={handlePrevMonth}>←</button>
          <span className="month-name" onClick={handleToday}>{monthName}</span>
          <button onClick={handleNextMonth}>→</button>
        </div>
      </div>

      {/* Legend */}
      <div className="mood-legend">
        {[1, 2, 3, 4, 5].map(score => (
          <div key={score} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: MOOD_COLORS[score] }}></div>
            <span>{MOOD_LABELS[score]}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="mood-calendar-grid">
        {dayLabels.map(label => (
          <div key={label} className="calendar-day-label">{label}</div>
        ))}
        
        {days.map((day, idx) => {
          const moodScore = getMoodScore(day);
          const moodColor = getMoodColor(moodScore);
          const today = new Date();
          const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

          return (
            <div
              key={idx}
              className={`calendar-day ${day ? 'active' : 'empty'} ${isToday ? 'today' : ''} ${moodScore ? 'has-mood' : ''}`}
              style={day && moodScore ? { 
                backgroundColor: moodColor,
                borderColor: moodColor, 
                borderWidth: '2px',
                color: 'white'
              } : {}}
              onClick={() => day && setSelectedDate(new Date(year, month - 1, day))}
            >
              {day && (
                <span className="day-number" style={moodScore ? { color: 'white', fontWeight: 'bold' } : {}}>{day}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="selected-date-info">
          <span>{selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
          <button onClick={() => setSelectedDate(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
