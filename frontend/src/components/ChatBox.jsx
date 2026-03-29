import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  CircularProgress,
  Typography,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { messageService } from '../services/api';
import ChatMessage from './ChatMessage';

export default function ChatBox({ appointmentId, otherUserName, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const res = await messageService.getMessages(appointmentId);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [appointmentId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setSending(true);
    try {
      await messageService.sendMessage({
        appointment_id: appointmentId,
        content: input,
      });
      setInput('');
      await loadMessages();
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.light',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {otherUserName}
        </Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          overflowY: 'auto',
          bgcolor: '#F9FAFB',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Typography color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
            Chưa có tin nhắn nào
          </Typography>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              message={msg}
              isSent={msg.senderId === localStorage.getItem('userId')}
              currentUser={currentUser}
              otherUserName={otherUserName}
            />
          ))
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          size="small"
          variant="outlined"
        />
        <Button
          type="submit"
          variant="contained"
          endIcon={<SendIcon />}
          disabled={sending || !input.trim()}
          sx={{ px: 3 }}
        >
          {sending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Gửi'}
        </Button>
      </Box>
    </Card>
  );
}
