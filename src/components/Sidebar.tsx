import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Paper
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as TransactionsIcon,
  PieChart as BudgetsIcon,
  Analytics as AnalysisIcon,
  Flag as GoalsIcon,
  SmartToy as AdvisorIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'transactions', label: 'Transactions', icon: <TransactionsIcon /> },
    { id: 'budgets', label: 'Budgets', icon: <BudgetsIcon /> },
    { id: 'analysis', label: 'Analysis', icon: <AnalysisIcon /> },
    { id: 'goals', label: 'Targets', icon: <GoalsIcon /> },
    { id: 'advisor', label: 'AI Advisor', icon: <AdvisorIcon /> },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        width: 280,
        minHeight: '100vh',
        background: '#2a2a3e',
        borderRight: '1px solid #3a3a4e',
        borderRadius: 0
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h5"
          sx={{
            color: '#1976d2',
            fontWeight: 'bold',
            mb: 4,
            textAlign: 'center'
          }}
        >
          Finance Manager
        </Typography>
        
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => onPageChange(item.id)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: currentPage === item.id ? '#1976d2' : 'transparent',
                  '&:hover': {
                    backgroundColor: currentPage === item.id ? '#1565c0' : '#3a3a4e'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: currentPage === item.id ? '#ffffff' : '#b0b0b0',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    color: currentPage === item.id ? '#ffffff' : '#b0b0b0',
                    '& .MuiListItemText-primary': {
                      fontWeight: currentPage === item.id ? 600 : 400
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 3, borderColor: '#3a3a4e' }} />
        
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={onLogout}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#3a3a4e'
                }
              }}
            >
              <ListItemIcon sx={{ color: '#b0b0b0', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                sx={{
                  color: '#b0b0b0'
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
};

export default Sidebar;
