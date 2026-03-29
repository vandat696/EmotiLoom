export const MOODS = [
  { emoji: '😄', label: 'Tuyệt vời', score: 5, color: '#FFD93D' },
  { emoji: '🙂', label: 'Tốt', score: 4, color: '#6BCB77' },
  { emoji: '😐', label: 'Bình thường', score: 3, color: '#4D96FF' },
  { emoji: '😔', label: 'Không tốt', score: 2, color: '#FF9B9B' },
  { emoji: '😢', label: 'Tệ', score: 1, color: '#C77DFF' },
];

export const ROLES = {
  STUDENT: 'student',
  COUNSELOR: 'counselor',
  ADMIN: 'admin',
};

export const USER_ROLES_LABEL = {
  student: 'Học sinh',
  counselor: 'Tư vấn viên',
  admin: 'Admin',
};

export const APP_SECTIONS = {
  HOME: 'home',
  DIARY: 'diary',
  AI_CHAT: 'ai_chat',
  APPOINTMENTS: 'appointments',
  COMMUNITY: 'community',
};

// Helper function to format date safely
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Try parsing as YYYY-MM-DD format
      const [year, month, day] = dateString.split('-');
      if (year && month && day) {
        return new Date(year, parseInt(month) - 1, day).toLocaleDateString('vi-VN');
      }
      return dateString;
    }
    return date.toLocaleDateString('vi-VN');
  } catch (err) {
    console.warn('Date format error:', dateString);
    return dateString || 'N/A';
  }
};

// Helper function to format time safely
export const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    console.warn('Time format error:', dateString);
    return dateString || 'N/A';
  }
};
