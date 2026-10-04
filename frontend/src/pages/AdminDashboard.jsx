import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Date localizer setup for the calendar
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('kaya_admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        // MongoDB data ko Calendar events format (title, start, end) mein convert karna
        const formattedEvents = (data.bookings || []).map((booking) => {
          const baseDate = new Date(booking.bookingDate);
          let startDateTime = new Date(baseDate);
          let endDateTime = new Date(baseDate);

          if (booking.bookingTime && booking.bookingTime !== "Scheduled") {
            const timeParts = booking.bookingTime.split(':');
            if (timeParts.length >= 2) {
              const hours = timeParts[0];
              const minutes = timeParts[1].replace(/[^0-9]/g, '');
              startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10) || 0, 0);
              endDateTime.setHours(parseInt(hours, 10) + 1, parseInt(minutes, 10) || 0, 0);
            }
          }

          return {
            id: booking._id || booking.id,
            title: `${booking.serviceName} - ${booking.customerName} (${booking.staffMember || 'Puja'})`,
            start: startDateTime,
            end: endDateTime,
            staff: booking.staffMember || 'Puja', // Color coding ke liye
          };
        });
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  // Staff ke hisaab se event ka color change karna
  const eventStyleGetter = (event) => {
    const backgroundColor = event.staff === 'Puja' ? '#d53f8c' : '#3182ce'; // Pink for Puja, Blue for Sia
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#2d3748' }}>Staff Appointment Calendar</h2>
      
      {/* Legend for Staff Colors */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#d53f8c', borderRadius: '4px' }}></div>
          <span>Puja</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#3182ce', borderRadius: '4px' }}></div>
          <span>Sia</span>
        </div>
      </div>

      <div style={{ height: '70vh', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="week"
        />
      </div>
    </div>
  );
}
