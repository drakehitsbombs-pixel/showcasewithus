export const generateGoogleCalendarUrl = (
  title: string,
  startTime: string,
  endTime: string,
  location?: string,
  description?: string
) => {
  const formatDateTime = (date: string) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDateTime(startTime)}/${formatDateTime(endTime)}`,
    ...(location && { location }),
    ...(description && { details: description }),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const generateICSFile = (
  id: string,
  title: string,
  startTime: string,
  endTime: string,
  location?: string,
  description?: string,
  organizerEmail?: string,
  attendeeEmail?: string
) => {
  const formatICSDate = (date: string) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Show Case//Booking//EN',
    'BEGIN:VEVENT',
    `UID:booking-${id}@showcase.app`,
    `DTSTART:${formatICSDate(startTime)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:${title}`,
    ...(description ? [`DESCRIPTION:${description.replace(/\n/g, '\\n')}`] : []),
    ...(location ? [`LOCATION:${location}`] : []),
    ...(organizerEmail ? [`ORGANIZER:mailto:${organizerEmail}`] : []),
    ...(attendeeEmail ? [`ATTENDEE:mailto:${attendeeEmail}`] : []),
    `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
};

export const downloadICSFile = (icsContent: string, filename: string) => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
