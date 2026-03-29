import React from 'react';
import {
  Box,
  Card,
  Typography,
  Avatar,
  Stack,
} from '@mui/material';
import { formatTime } from '../constants';

export default function ChatMessage({ message, isSent, currentUser, otherUserName }) {
  const isUser = isSent;
  const senderName = isUser ? (currentUser?.username || 'You') : otherUserName;
  
  return (
    <Stack
      direction={isUser ? 'row-reverse' : 'row'}
      spacing={1}
      sx={{ mb: 2, alignItems: 'flex-end' }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: isUser ? 'primary.main' : 'secondary.main',
        }}
      >
        {senderName?.[0]?.toUpperCase() || 'U'}
      </Avatar>
      
      <Box sx={{ maxWidth: '70%' }}>
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
          {senderName}
        </Typography>
        <Card
          sx={{
            p: 1.5,
            bgcolor: isUser ? 'primary.light' : 'grey.100',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: 2,
            wordBreak: 'break-word',
          }}
        >
          <Typography variant="body2">
            {message.text || message.content}
          </Typography>
        </Card>
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ display: 'block', mt: 0.5, textAlign: isUser ? 'right' : 'left' }}
        >
          {formatTime(message.created_at || message.timestamp)}
        </Typography>
      </Box>
    </Stack>
  );
}
