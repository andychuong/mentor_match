export function convertToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(',') + '\n';
  }

  // Escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    // If value contains comma, newline, or quote, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV
  const rows: string[] = [];
  
  // Header row
  rows.push(headers.map(escapeCSV).join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      // Handle nested properties (e.g., "mentor.name")
      const keys = header.split('.');
      let value = row;
      for (const key of keys) {
        value = value?.[key];
      }
      return escapeCSV(value);
    });
    rows.push(values.join(','));
  }

  return rows.join('\n');
}

export function exportSessionsToCSV(sessions: any[]): string {
  const headers = [
    'id',
    'mentor.name',
    'mentor.email',
    'mentee.name',
    'mentee.email',
    'scheduledAt',
    'durationMinutes',
    'status',
    'topic',
    'matchScore',
    'createdAt',
  ];

  return convertToCSV(sessions, headers);
}

export function exportUsersToCSV(users: any[]): string {
  const headers = [
    'id',
    'email',
    'name',
    'role',
    'isActive',
    'expertiseAreas',
    'industryFocus',
    'startupStage',
    'createdAt',
  ];

  // Convert arrays to comma-separated strings for CSV
  const processedUsers = users.map((user) => ({
    ...user,
    expertiseAreas: Array.isArray(user.expertiseAreas) ? user.expertiseAreas.join('; ') : '',
    industryFocus: Array.isArray(user.industryFocus) ? user.industryFocus.join('; ') : '',
  }));

  return convertToCSV(processedUsers, headers);
}

export function exportFeedbackToCSV(feedback: any[]): string {
  const headers = [
    'id',
    'sessionId',
    'mentorId',
    'menteeId',
    'rating',
    'writtenFeedback',
    'topicsCovered',
    'helpfulnessRating',
    'wouldRecommend',
    'isAnonymous',
    'createdAt',
  ];

  // Convert arrays to comma-separated strings for CSV
  const processedFeedback = feedback.map((item) => ({
    ...item,
    topicsCovered: Array.isArray(item.topicsCovered) ? item.topicsCovered.join('; ') : '',
  }));

  return convertToCSV(processedFeedback, headers);
}

