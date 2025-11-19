export interface MenteeProfile {
  id: string;
  industryFocus?: string[];
  startupStage?: string | null;
}

export interface MentorProfile {
  id: string;
  name?: string | null;
  email: string;
  expertiseAreas?: string[];
  industryFocus?: string[];
  bio?: string | null;
  mentorFeedback?: Array<{ rating: number; helpfulnessRating: number }>;
  mentorSessions?: Array<{ id: string }>;
}

export interface MatchFilters {
  expertise?: string[];
  industry?: string[];
  available?: boolean;
  minRating?: number;
  limit?: number;
}

export interface SessionData {
  mentorName: string;
  scheduledAt: string;
  durationMinutes: number;
  topic?: string;
}

export interface AirtableRecordData {
  Email: string;
  Name: string;
  Role: string;
  Bio: string;
  'Profile Picture URL': string;
  'Is Active': boolean;
  'Expertise Areas'?: string | string[];
  'Industry Focus'?: string | string[];
  'Startup Stage'?: string;
  [key: string]: string | string[] | boolean | undefined;
}

