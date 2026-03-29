import React, { useState } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Typography,
  Container,
} from '@mui/material';
import { authService } from '../services/api';

export default function LoginForm({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'student',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authService.login({
        username: formData.username,
        password: formData.password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', formData.username);
      onLoginSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#F9FAFB' }}>
      <Container maxWidth="sm">
        <Card sx={{ p: 4 }}>
          <Typography variant="h3" sx={{ mb: 3, textAlign: 'center', fontWeight: 700 }}>
            Đăng Nhập
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Tên đăng nhập"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Mật khẩu"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              fullWidth
              disabled={loading}
            />

            <FormControl fullWidth margin="normal" disabled={loading}>
              <InputLabel>Vai trò</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Vai trò"
              >
                <MenuItem value="student">Học sinh</MenuItem>
                <MenuItem value="counselor">Tư vấn viên</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Đăng Nhập'}
            </Button>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}
