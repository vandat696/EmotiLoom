import React from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import { MOODS } from '../constants';

export default function MoodSelector({ selectedMood, onMoodSelect }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Tâm trạng của bạn hôm nay?
      </Typography>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
        {MOODS.map((mood) => (
          <Button
            key={mood.score}
            onClick={() => onMoodSelect(mood)}
            sx={{
              flex: '0 0 calc(20% - 10px)',
              minWidth: '100px',
              p: 2,
              borderRadius: 2,
              border: selectedMood?.score === mood.score ? '3px solid' : '2px solid #E5E7EB',
              borderColor: selectedMood?.score === mood.score ? 'primary.main' : 'transparent',
              bgcolor: selectedMood?.score === mood.score ? 'primary.light' : 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography sx={{ fontSize: '2rem' }}>{mood.emoji}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }}>
              {mood.label}
            </Typography>
          </Button>
        ))}
      </Stack>
    </Box>
  );
}
