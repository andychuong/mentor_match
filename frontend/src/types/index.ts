export type UserRole = 'mentor' | 'mentee' | 'admin';
export type AirtableSyncStatus = 'synced' | 'pending' | 'error';
export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: {
    name: string;
    bio: string;
    profilePictureUrl: string;
    expertiseAreas?: string[];
    industryFocus?: string[];
    startupStage?: string;
  };
  airtableSyncStatus: AirtableSyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Mentor {
  id: string;
  profile: User['profile'];
  matchScore?: number;
  matchReasoning?: string;
  availableSlots?: TimeSlot[];
  averageRating?: number;
  totalSessions?: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface Session {
  id: string;
  mentorId: string;
  menteeId: string;
  mentor: {
    name: string;
    profilePictureUrl: string;
  };
  mentee: {
    name: string;
    profilePictureUrl: string;
  };
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  topic: string;
  notes: string;
  matchScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  sessionId: string;
  rating: number;
  writtenFeedback?: string;
  topicsCovered?: string[];
  helpfulnessRating?: number;
  wouldRecommend?: boolean;
  isAnonymous?: boolean;
  createdAt: string;
}

export interface FeedbackStats {
  averageRating: number;
  totalFeedback: number;
  ratingDistribution: Record<number, number>;
  helpfulnessAverage: number;
  recommendationRate: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  message?: string;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface Analytics {
  totalSessions: number;
  mentorUtilizationRate: number;
  averageSessionRating: number;
  activeUsersCount: number;
  sessionVolumeOverTime?: Array<{ date: string; count: number }>;
  mentorUtilizationByExpertise?: Array<{ expertise: string; utilization: number }>;
  ratingDistribution?: Record<number, number>;
}



