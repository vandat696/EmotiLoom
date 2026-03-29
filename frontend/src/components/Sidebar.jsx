import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Button,
  Avatar,
  Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import { APP_SECTIONS } from '../constants';

const drawerWidth = 280;

export default function Sidebar({ currentUser, activeSection, onSectionChange, onLogout }) {
  const menuItems = [
    { id: APP_SECTIONS.HOME, label: 'Trang chủ', icon: HomeIcon },
    { id: APP_SECTIONS.DIARY, label: 'Nhật ký', icon: LibraryBooksIcon },
    { id: APP_SECTIONS.AI_CHAT, label: 'Trò chuyện AI', icon: SmartToyIcon },
    { id: APP_SECTIONS.APPOINTMENTS, label: 'Lịch hẹn', icon: EventIcon },
    { id: APP_SECTIONS.COMMUNITY, label: 'Cộng đồng', icon: GroupIcon },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#F9FAFB',
          borderRight: '1px solid #E5E7EB',
        },
      }}
    >
      {/* User Profile Section */}
      <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid #E5E7EB' }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            margin: '0 auto 12px',
            bgcolor: 'primary.main',
            cursor: 'pointer',
          }}
        >
          {currentUser?.username?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {currentUser?.username || 'User'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {currentUser?.role || 'Student'}
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItem
              button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              selected={activeSection === item.id}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1,
                cursor: 'pointer',
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.dark',
                  },
                },
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Icon />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          );
        })}
      </List>

      {/* Logout Section */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
        >
          Đăng Xuất
        </Button>
      </Box>
    </Drawer>
  );
}

export { drawerWidth };
