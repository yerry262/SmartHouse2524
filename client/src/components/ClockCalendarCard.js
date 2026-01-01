import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Grid, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(60, 74, 138, 0.4) 0%, rgba(70, 44, 96, 0.4) 100%)',
  backgroundColor: 'rgba(20, 20, 30, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#fff',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '300px', // Match typical device card height
}));

const CalendarHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px',
});

const CalendarGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '5px',
  textAlign: 'center',
});

const DayLabel = styled(Typography)({
  fontSize: '0.75rem',
  color: 'rgba(255, 255, 255, 0.7)',
  fontWeight: 'bold',
});

const DateCell = styled(Box)(({ isToday, isCurrentMonth }) => ({
  padding: '5px',
  borderRadius: '50%',
  backgroundColor: isToday ? '#667eea' : 'transparent',
  color: isCurrentMonth ? '#fff' : 'rgba(255, 255, 255, 0.3)',
  cursor: 'default',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '30px',
  margin: '0 auto',
  '&:hover': {
    backgroundColor: isToday ? '#667eea' : 'rgba(255, 255, 255, 0.1)',
  },
}));

const ClockCalendarCard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    const days = [];
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Day labels
    dayLabels.forEach((label, index) => {
      days.push(<DayLabel key={`label-${index}`}>{label}</DayLabel>);
    });

    // Previous month's days
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <DateCell key={`prev-${i}`} isCurrentMonth={false}>
          {daysInPrevMonth - firstDay + 1 + i}
        </DateCell>
      );
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday =
        i === currentTime.getDate() &&
        month === currentTime.getMonth() &&
        year === currentTime.getFullYear();
      days.push(
        <DateCell key={`curr-${i}`} isCurrentMonth={true} isToday={isToday}>
          {i}
        </DateCell>
      );
    }

    // Next month's days to fill the grid (assuming 6 rows max = 42 cells)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <DateCell key={`next-${i}`} isCurrentMonth={false}>
          {i}
        </DateCell>
      );
    }

    return days;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <StyledCard>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', letterSpacing: '2px' }}>
            {formatTime(currentTime)}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {formatDate(currentTime)}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <CalendarHeader>
            <IconButton size="small" onClick={handlePrevMonth} sx={{ color: 'white' }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {viewDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </Typography>
            <IconButton size="small" onClick={handleNextMonth} sx={{ color: 'white' }}>
              <ChevronRightIcon />
            </IconButton>
          </CalendarHeader>
          <CalendarGrid>
            {renderCalendar()}
          </CalendarGrid>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default ClockCalendarCard;
