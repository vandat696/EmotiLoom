import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
};

// Diary API
export const diaryService = {
  getEntries: () => api.get('/api/diary'),
  createEntry: (data) => api.post('/api/diary', data),
  deleteEntry: (id) => api.delete(`/api/diary/${id}`),
};

// AI Chat API
export const aiService = {
  chat: (message) => api.post('/api/ai-chat', { message }),
  getHistory: () => api.get('/api/ai-chat/history'),
  clearHistory: () => api.delete('/api/ai-chat/history'),
};

// Appointment API
export const appointmentService = {
  getCounselors: () => api.get('/api/counselors'),
  getAppointments: () => api.get('/api/appointments'),
  createAppointment: (data) => api.post('/api/appointments', data),
  updateAppointment: (id, data) => api.put(`/api/appointments/${id}/status`, data),
  deleteAppointment: (id) => api.delete(`/api/appointments/${id}`),
};

// Messages API
export const messageService = {
  getMessages: (appointmentId) => api.get(`/api/messages/${appointmentId}`),
  sendMessage: (data) => api.post('/api/messages', data),
};

// Community API
export const communityService = {
  getPosts: () => api.get('/api/posts'),
  createPost: (data) => api.post('/api/posts', data),
  deletePost: (id) => api.delete(`/api/posts/${id}`),
  getComments: (postId) => api.get(`/api/posts/${postId}/comments`),
  addComment: (data) => api.post('/api/comments', data),
  toggleLike: (data) => api.post('/api/likes', data),
};

export default api;
